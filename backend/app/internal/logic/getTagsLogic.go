package logic

import (
	"context"
	"qiniuyun/backend/model"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTagsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTagsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTagsLogic {
	return &GetTagsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTagsLogic) GetTags() (resp []types.Tag, err error) {
	tags, err := l.svcCtx.TagModel.FindAll(l.ctx)
	if err != nil {
		return nil, err
	}
	return castTags(tags), nil
}

func castTags(tags []*model.Tag) []types.Tag {
	res := make([]types.Tag, 0)
	for _, tag := range tags {
		res = append(res, types.Tag{
			Id:   tag.Id,
			Name: tag.Name,
		})
	}
	return res
}
