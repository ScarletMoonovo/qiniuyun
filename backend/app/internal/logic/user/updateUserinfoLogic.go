package user

import (
	"context"
	"database/sql"
	"qiniuyun/backend/common/ctxdata"
	"time"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateUserinfoLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateUserinfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateUserinfoLogic {
	return &UpdateUserinfoLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateUserinfoLogic) UpdateUserinfo(req *types.User) error {
	id := ctxdata.GetUidFromCtx(l.ctx)
	userinfo, err := l.svcCtx.UserModel.FindOne(l.ctx, id)
	if err != nil {
		return err
	}
	if req.Sex != "" {
		userinfo.Sex = sql.NullString{String: req.Sex, Valid: true}
	}
	if req.Signature != "" {
		userinfo.Signature = sql.NullString{String: req.Signature, Valid: true}
	}
	if req.Birthday != 0 {
		birthday := time.Unix(req.Birthday, 0)
		userinfo.Birthday = sql.NullTime{Time: birthday, Valid: true}
	}

	err = l.svcCtx.UserModel.Update(l.ctx, nil, userinfo)
	return err
}
