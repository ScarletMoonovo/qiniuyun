package user

import (
	"context"
	"github.com/pkg/errors"
	"qiniuyun/backend/common/auth"
	"qiniuyun/backend/common/errorz"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type RefreshTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRefreshTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RefreshTokenLogic {
	return &RefreshTokenLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RefreshTokenLogic) RefreshToken(token string) (resp *types.RefreshResponse, err error) {
	claim, err := auth.ParseJwtToken(token)
	if err != nil {
		return nil, errors.New("需要重新登录")
	}
	accessExpire := l.svcCtx.Config.JwtAuth.AccessExpire
	accessToken, refreshToken, err := auth.GetJwtToken(accessExpire, claim.Id, 0)
	if err != nil {
		return nil, errors.Wrapf(errorz.NewErrMsg("token生成失败"), "GenerateToken userId : %d", claim.Id)
	}
	return &types.RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
