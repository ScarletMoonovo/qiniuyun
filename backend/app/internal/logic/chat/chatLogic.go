package chat

import (
	"context"
	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
	"github.com/sashabaranov/go-openai"
	"github.com/zeromicro/go-zero/core/logx"
	"log"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/common/ctxdata"
	"qiniuyun/backend/model"
)

type WSResponse struct {
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
	userId := ctxdata.GetUidFromCtx(l.ctx)
	session, err := l.svcCtx.SessionModel.FindOne(ctx, sessionId)
	if err != nil {
		return err
	}
	if session.UserId != userId {
		return errors.New("no permission")
	}
	historyMsgs, err := l.svcCtx.MessageModel.FindBySession(ctx, sessionId)
	if err != nil {
		return err
	}
	for _, msg := range historyMsgs {
		conn.WriteJSON(WSResponse{
			Type: "message",
			Msg:  msg,
		})
	}
	for {
		_, content, err := conn.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		if err := l.svcCtx.MessageModel.Insert(ctx, nil, &model.Message{
			SessionId: sessionId,
			Role:      "user",
			Content:   string(content),
		}); err != nil {
			log.Println("db insert user msg:", err)
			continue
		}
		stream, err := l.svcCtx.LLM.GetStream(castHistory(historyMsgs))
		if err != nil {
			return err
		}
		defer stream.Close()

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
			conn.WriteJSON(WSResponse{
				Type:    "delta",
				Content: delta,
			})
		}
		if err := l.svcCtx.MessageModel.Insert(ctx, nil, &model.Message{
			SessionId: sessionId,
			Role:      "assistant",
			Content:   fullReply,
		}); err != nil {
			log.Println("db insert user msg:", err)
			continue
		}
		conn.WriteJSON(WSResponse{
			Type: "done",
		})
	}
	return nil
}

func castHistory(messages []*model.Message) []openai.ChatCompletionMessage {
	chatMessages := make([]openai.ChatCompletionMessage, 0, len(messages))
	for _, msg := range messages {
		chatMessages = append(chatMessages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}
	return chatMessages
}
