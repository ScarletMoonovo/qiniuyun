package user

import (
	"context"
	"github.com/pkg/errors"
	"qiniuyun/backend/common/crypt"
	"qiniuyun/backend/common/ctxdata"
	"qiniuyun/backend/common/errorz"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ChangePwdLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewChangePwdLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ChangePwdLogic {
	return &ChangePwdLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ChangePwdLogic) ChangePwd(req *types.ChangePwdRequest) error {
	id := ctxdata.GetUidFromCtx(l.ctx)
	u, err := l.svcCtx.UserModel.FindOne(l.ctx, id)
	if err != nil {
		return errors.Wrapf(errorz.NewErrCode(errorz.DB_ERROR), "userid: %v,err: %+v", id, err)
	}
	pwd, err := crypt.EncryptBcrypt(req.Password)
	if err != nil {
		return errorz.NewErrMsg("密码加密出错")
	}
	u.Password = pwd
	err = l.svcCtx.UserModel.Update(l.ctx, nil, u)
	if err != nil {
		return errors.Wrapf(errorz.NewErrCode(errorz.DB_ERROR), "userid: %v,err: %+v", id, err)
	}
	return nil
}
