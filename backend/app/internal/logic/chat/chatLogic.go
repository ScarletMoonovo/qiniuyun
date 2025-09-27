package chat

import (
	"context"
	"encoding/json"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
	"github.com/sashabaranov/go-openai"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
	"log"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/common/auth"
	"qiniuyun/backend/common/globalkey"
	"qiniuyun/backend/model"
	"strings"
)

const (
	WSMessageTypeDelta   = "delta"
	WSMessageTypeMessage = "message"
	WSMessageTypeDone    = "done"

	RoleUser      = "user"
	RoleAssistant = "assistant"
	RoleSystem    = "system"

	MaxHistoryMessages = 10
)

type wsResponse struct {
	Type    string         `json:"type,omitempty"`
	Msg     *model.Message `json:"msg,omitempty"`
	Content string         `json:"content,omitempty"`
}

type ChatLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

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
	var authReq auth.WSAuthRequest
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
			Type: WSMessageTypeMessage,
			Msg:  msg,
		})
	}
	for {
		_, content, err := conn.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
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
			conn.WriteJSON(wsResponse{
				Type:    WSMessageTypeDelta,
				Content: delta,
			})
		}
		_ = stream.Close()
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
				Type: WSMessageTypeDone,
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
