package chat

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
	"github.com/sashabaranov/go-openai"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
	"log"
	"net/http"
	"net/url"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/common/auth"
	"qiniuyun/backend/common/globalkey"
	"qiniuyun/backend/model"
	"strings"
)

const (
	WSMessageResponseTypeDelta   = "delta"
	WSMessageResponseTypeMessage = "message"
	WSMessageResponseTypeDone    = "done"
	WSMessageResponseTypeAudio   = "audio"

	WSMessageRequestTypeText  = "text"
	WSMessageRequestTypeVoice = "voice"
	WSMessageRequestTypeAuth  = "auth"

	RoleUser      = "user"
	RoleAssistant = "assistant"
	RoleSystem    = "system"

	MaxHistoryMessages = 10
)

type wsResponse struct {
	Type    string         `json:"type,omitempty"`
	Msg     *model.Message `json:"msg,omitempty"`
	Content string         `json:"content,omitempty"`
	Audio   []byte         `json:"audio,omitempty"`
}

type ChatLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

var (
	ttsUrl = url.URL{Scheme: "wss", Host: "openai.qiniu.com", Path: "/v1/voice/tts"}
)

func NewChatLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ChatLogic {
	return &ChatLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ChatLogic) Chat(req *types.ChatRequest, conn *websocket.Conn) error {
	ctx := context.Background()
	sessionId := req.SessionId
	var authReq auth.WSRequest
	_, c, err := conn.ReadMessage()
	if err != nil {
		logx.Error(err)
		return err
	}
	err = json.Unmarshal(c, &authReq)
	if err != nil {
		logx.Error(err)
		return err
	}
	userId, err := auth.ValidateWs(authReq)
	session, err := l.svcCtx.SessionModel.FindOne(ctx, sessionId)
	if err != nil {
		return err
	}
	if session.UserId != userId {
		return errors.New("no permission")
	}
	character, err := l.svcCtx.CharacterModel.FindOne(ctx, session.CharacterId)
	if err != nil {
		return err
	}
	historyMsgs, err := l.svcCtx.MessageModel.FindBySession(ctx, sessionId)
	if err != nil {
		return err
	}
	for _, msg := range historyMsgs {
		conn.WriteJSON(wsResponse{
			Type: WSMessageResponseTypeMessage,
			Msg:  msg,
		})
	}
	for {
		_, content, err := conn.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		var data auth.WSRequest
		json.Unmarshal(content, &data)

		historyMsgs = append(historyMsgs, &model.Message{
			SessionId: sessionId,
			Role:      RoleUser,
			Content:   string(content),
		})
		vector, err := l.svcCtx.Embedding.GetEmbedding(string(content))
		var memory []string
		if err == nil {
			memory, _ = l.svcCtx.Embedding.Search(globalkey.Collection(character.Id), vector)
		}
		stream, err := l.svcCtx.LLM.GetStream(castHistory(historyMsgs, character.SystemPrompt, memory))
		if err != nil {
			return err
		}
		var fullReply string
		for {
			resp, err := stream.Recv()
			if err != nil {
				break
			}
			if len(resp.Choices) == 0 {
				continue
			}
			delta := resp.Choices[0].Delta.Content
			if delta == "" {
				continue
			}
			fullReply += delta
			if data.Type == WSMessageRequestTypeText {
				conn.WriteJSON(wsResponse{
					Type:    WSMessageResponseTypeDelta,
					Content: delta,
				})
			}
		}
		_ = stream.Close()
		if data.Type == WSMessageRequestTypeVoice {
			audioRes(fullReply, character.Voice, l.svcCtx.Config.LLM.ApiKey, conn)
			if err := conn.WriteJSON(wsResponse{
				Type: WSMessageResponseTypeMessage,
				Msg: &model.Message{
					SessionId: sessionId,
					Role:      RoleAssistant,
					Content:   fullReply,
				},
			}); err != nil {
				logx.Error(err)
			}
		}
		historyMsgs = append(historyMsgs, &model.Message{
			SessionId: sessionId,
			Role:      RoleAssistant,
			Content:   fullReply,
		})
		if err := l.svcCtx.MessageModel.Transaction(ctx, func(db *gorm.DB) error {
			if err := l.svcCtx.MessageModel.Insert(ctx, db, &model.Message{
				SessionId: sessionId,
				Role:      RoleUser,
				Content:   string(content),
			}); err != nil {
				return err
			}
			if err := l.svcCtx.MessageModel.Insert(ctx, db, &model.Message{
				SessionId: sessionId,
				Role:      RoleAssistant,
				Content:   fullReply,
			}); err != nil {
				return err
			}
			return nil
		}); err != nil {
			logx.Error(err)
			return err
		}
		for i := 0; i < 5; i++ {
			if err := conn.WriteJSON(wsResponse{
				Type: WSMessageResponseTypeDone,
			}); err != nil {
				logx.Error(err)
			}
		}
	}
	return nil
}

func castHistory(messages []*model.Message, systemPrompt string, memory []string) []openai.ChatCompletionMessage {
	if len(messages) > MaxHistoryMessages {
		messages = messages[len(messages)-MaxHistoryMessages:]
	}
	// 构建 memory 内容，使用清晰分隔符
	memoryContent := ""
	if len(memory) > 0 {
		memoryContent = "=== Relevant Memory ===\n" + strings.Join(memory, "\n") + "\n=== End of Memory ==="
	}
	fullSystemPrompt := systemPrompt
	if memoryContent != "" {
		fullSystemPrompt += "\n\n" + memoryContent
	}
	chatMessages := make([]openai.ChatCompletionMessage, 0, len(messages)+1)
	chatMessages = append(chatMessages, openai.ChatCompletionMessage{
		Role:    RoleSystem,
		Content: fullSystemPrompt,
	})
	for _, msg := range messages {
		chatMessages = append(chatMessages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}
	return chatMessages
}

func audioRes(text, voiceType, sk string, conn *websocket.Conn) {
	input := setupInput(voiceType, "mp3", 1.0, text)
	c, _, err := websocket.DefaultDialer.Dial(ttsUrl.String(), http.Header{
		"Authorization": []string{fmt.Sprintf("Bearer %s", sk)},
		"VoiceType":     []string{voiceType},
	})
	if err != nil {
		fmt.Println("dial err:", err)
		return
	}
	defer c.Close()
	err = c.WriteMessage(websocket.BinaryMessage, input)
	if err != nil {
		fmt.Println("write message fail, err:", err.Error())
		return
	}
	count := 0
	var audio []byte
	for {
		count++
		var message []byte
		_, message, err := c.ReadMessage()
		if err != nil {
			fmt.Println("read message fail, err:", err.Error())
			break
		}
		var resp RelayTTSResponse
		err = json.Unmarshal(message, &resp)
		if err != nil {
			fmt.Println("unmarshal fail, err:", err.Error())
			continue
		}
		d, err := base64.StdEncoding.DecodeString(resp.Data)
		if err != nil {
			fmt.Println("decode fail, err:", err.Error())
		}
		audio = append(audio, d...)
		if resp.Sequence < 0 {
			fmt.Println("write to client")
			conn.WriteJSON(wsResponse{
				Type:  WSMessageResponseTypeAudio,
				Audio: audio,
			})
			break
		}
	}
}

func setupInput(voiceType string, encoding string, speedRatio float64, text string) []byte {
	params := &TTSRequest{
		Audio: Audio{
			VoiceType:  voiceType,
			Encoding:   encoding,
			SpeedRatio: speedRatio,
		},
		Request: Request{
			Text: text,
		},
	}
	resStr, _ := json.Marshal(params)
	return resStr
}

type TTSRequest struct {
	Audio   `json:"audio"`
	Request `json:"request"`
}
type Audio struct {
	VoiceType  string  `json:"voice_type"`
	Encoding   string  `json:"encoding"`
	SpeedRatio float64 `json:"speed_ratio"`
}
type Request struct {
	Text string `json:"text"`
}
type RelayTTSResponse struct {
	Reqid     string    `json:"reqid"`
	Operation string    `json:"operation"`
	Sequence  int       `json:"sequence"`
	Data      string    `json:"data"`
	Addition  *Addition `json:"addition,omitempty"`
}
type Addition struct {
	Duration string `json:"duration"`
}
