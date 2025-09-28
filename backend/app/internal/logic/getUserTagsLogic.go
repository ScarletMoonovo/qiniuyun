package logic

import (
	"context"
	"qiniuyun/backend/common/ctxdata"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserTagsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUserTagsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserTagsLogic {
	return &GetUserTagsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserTagsLogic) GetUserTags() (resp []types.Tag, err error) {
	userId := ctxdata.GetUidFromCtx(l.ctx)
	tags, err := l.svcCtx.UserTagModel.FindByUserId(l.ctx, userId)
	if err != nil {
		return nil, err
	}
	resp = make([]types.Tag, 0)
	for _, tag := range tags {
		one, err := l.svcCtx.TagModel.FindOne(l.ctx, tag.Id)
		if err != nil {
			return nil, err
		}
		resp = append(resp, types.Tag{
			Id:   one.Id,
			Name: one.Name,
		})
	}
	return resp, nil
}
