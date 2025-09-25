package user

import (
	"context"
	"github.com/zeromicro/go-zero/core/logx"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/model"
)

type GetUserByNameLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUserByNameLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserByNameLogic {
	return &GetUserByNameLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserByNameLogic) GetUserByName(req *types.GetUserByNameRequest) (resp *types.GetUserByNameResponse, err error) {
	users, err := l.svcCtx.UserModel.FuzzyFind(l.ctx, req.Cursor, req.PageSize, "name", req.Name)
	if err != nil {
		return nil, err
	}

	resUsers := castUsers(users)
	resp = new(types.GetUserByNameResponse)
	resp.Users = resUsers

	return resp, nil
}

func castUsers(users []*model.User) []types.User {
	resUsers := make([]types.User, len(users))
	for i, user := range users {
		resUsers[i] = castUser(user)
	}
	return resUsers
}

func castUser(user *model.User) types.User {
	return types.User{
		ID:        user.Id,
		Name:      user.Name,
		Avatar:    user.Avatar,
		Birthday:  user.Birthday.Time.Unix(),
		Sex:       user.Sex.String,
		Signature: user.Signature.String,
	}
}
