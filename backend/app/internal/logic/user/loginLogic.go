package user

import (
	"context"
	"github.com/pkg/errors"
	"github.com/zeromicro/go-zero/core/logx"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/common/auth"
	"qiniuyun/backend/common/crypt"
	"qiniuyun/backend/common/errorz"
	"qiniuyun/backend/common/globalkey"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginRequest) (resp *types.LoginResponse, err error) {
	//查询userid
	userid, err := l.svcCtx.UserModel.FindOneByEmail(l.ctx, req.Email)
	if err != nil {
		return nil, errors.Wrapf(errorz.NewErrCode(errorz.DB_ERROR), "email: %v,err: %+v", req.Email, err)
	}
	// 验证验证码登录
	if len(req.Captcha) != 0 {
		captcha, _ := l.svcCtx.Redis.Get(l.ctx, globalkey.Email(req.Email)).Result()
		if captcha != req.Captcha {
			return nil, errors.Wrapf(errorz.NewErrCode(errorz.CAPTCHA_VALIDATE_ERROR), "email: %v,err: %+v", req.Email)
		}
		return generateToken(l.svcCtx.Config.JwtAuth.AccessExpire, userid.Id)
	}
	// 验证密码登录
	if !crypt.ValidateBcrypt(userid.Password, req.Password) {
		return nil, errors.Wrapf(errorz.NewErrMsg("密码错误"), "Login userId : %d", userid.Id)
	}

	return generateToken(l.svcCtx.Config.JwtAuth.AccessExpire, userid.Id)
}

func generateToken(accessExpire int64, userId int64) (*types.LoginResponse, error) {
	accessToken, refreshToken, err := auth.GetJwtToken(accessExpire, userId, 0)
	if err != nil {
		return nil, errors.Wrapf(errorz.NewErrMsg("token生成失败"), "GenerateToken userId : %d", userId)
	}
	return &types.LoginResponse{
		ID:           userId,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
