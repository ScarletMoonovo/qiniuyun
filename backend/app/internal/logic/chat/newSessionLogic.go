package chat

import (
	"context"
	"gorm.io/gorm"
	"qiniuyun/backend/common/ctxdata"
	"qiniuyun/backend/model"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type NewSessionLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewNewSessionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *NewSessionLogic {
	return &NewSessionLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *NewSessionLogic) NewSession(req *types.NewSessionRequest) (resp *types.NewSessionResponse, err error) {
	userId := ctxdata.GetUidFromCtx(l.ctx)
	character, err := l.svcCtx.CharacterModel.FindOne(l.ctx, req.CharacterId)
	if err != nil {
		return nil, err
	}
	opening, err := l.svcCtx.LLM.GenerateOpening(character.OpenLine)
	if err != nil {
		return nil, err
	}
	session := model.Session{
		CharacterId: req.CharacterId,
		UserId:      userId,
		Title:       getTitle(opening),
	}
	err = l.svcCtx.MessageModel.Transaction(l.ctx, func(db *gorm.DB) error {
		e := l.svcCtx.SessionModel.Insert(l.ctx, db, &session)
		if e != nil {
			return e
		}
		e = l.svcCtx.MessageModel.Insert(l.ctx, db, &model.Message{
			SessionId: session.Id,
			Role:      "assistant",
			Content:   opening,
		})
		return e
	})
	return &types.NewSessionResponse{SessionId: session.Id}, nil
}

func getTitle(opening string) string {
	if len([]rune(opening)) > 20 {
		return string([]rune(opening)[:20]) + "..."
	}
	return opening
}
