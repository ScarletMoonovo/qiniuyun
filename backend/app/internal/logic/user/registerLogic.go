package user

import (
	"context"
	"github.com/pkg/errors"
	"html"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/common/auth"
	"qiniuyun/backend/common/crypt"
	"qiniuyun/backend/common/errorz"
	"qiniuyun/backend/common/globalkey"
	"qiniuyun/backend/model"

	"github.com/zeromicro/go-zero/core/logx"
)

type RegisterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterLogic {
	return &RegisterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RegisterLogic) Register(req *types.RegisterRequest) (resp *types.RegisterResponse, err error) {
	//转义过滤持久型XSS
	req.Name = html.EscapeString(req.Name)

	//查询内存中向该邮箱发送验证码的行为是否存活
	captcha, _ := l.svcCtx.Redis.Get(l.ctx, globalkey.Email(req.Email)).Result()
	if captcha != req.Captcha {
		return nil, errors.Wrapf(errorz.NewErrCode(errorz.CAPTCHA_VALIDATE_ERROR), "email: %v", req.Email)
	}
	//创建新用户
	pwd, err := crypt.EncryptBcrypt(req.Password)
	if err != nil {
		return nil, errorz.NewErrMsg("密码加密出错")
	}
	user := &model.User{Name: req.Name, Email: req.Email, Password: pwd}
	err = l.svcCtx.UserModel.Insert(l.ctx, nil, user)

	if err != nil {
		return nil, errors.Wrapf(errorz.NewErrCode(errorz.DB_ERROR), "register insert err: %+v", err)
	}

	accessExpire := l.svcCtx.Config.JwtAuth.AccessExpire
	accessToken, refreshToken, err := auth.GetJwtToken(accessExpire, user.Id, 0)
	if err != nil {
		return nil, errors.Wrapf(errorz.NewErrMsg("token生成失败"), "GenerateToken userId : %d", user.Id)
	}

	return &types.RegisterResponse{
		ID:           user.Id,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
