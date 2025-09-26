package chat

import (
	"context"
	"qiniuyun/backend/common/ctxdata"
	"qiniuyun/backend/model"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSessionLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSessionLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSessionLogic {
	return &GetSessionLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSessionLogic) GetSession(req *types.GetSessionRequest) (resp *types.GetSessionResponse, err error) {
	userId := ctxdata.GetUidFromCtx(l.ctx)
	sessions, err := l.svcCtx.SessionModel.FindByQuery(l.ctx, req.Cursor, req.PageSize, map[string]interface{}{"user_id": userId})
	if err != nil {
		return nil, err
	}
	return &types.GetSessionResponse{Sessions: castSessions(sessions, userId)}, nil
}

func castSessions(sessions []*model.Session, userId int64) []types.Session {
	res := make([]types.Session, 0)
	for _, session := range sessions {
		res = append(res, types.Session{
			SessionId:   session.Id,
			UserId:      userId,
			CharacterId: session.CharacterId,
			Title:       session.Title,
			CreatedAt:   session.CreatedAt.Unix(),
			UpdatedAt:   session.UpdatedAt.Unix(),
		})
	}
	return res
}
