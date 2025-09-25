package user

import (
	"context"
	"github.com/pkg/errors"
	"gopkg.in/gomail.v2"
	"math/rand"
	"qiniuyun/backend/common/errorz"
	"qiniuyun/backend/common/globalkey"
	"strconv"
	"time"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

const (
	Subject = "您的验证码为："
	Port    = 587
)

type SendCaptchaLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendCaptchaLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendCaptchaLogic {
	return &SendCaptchaLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendCaptchaLogic) SendCaptcha(req *types.CaptchaRequest) error {
	es := l.svcCtx.Config.EmailService
	m := gomail.NewMessage()
	m.SetHeader("From", es.From)
	m.SetHeader("To", req.Email)
	m.SetHeader("Subject", Subject)

	// 简单设置文件发送的内容，暂时设置成纯文本
	num := rand.Intn(900000) + 100000
	n := strconv.Itoa(num)
	success, err := l.svcCtx.Redis.SetNX(context.Background(), globalkey.Email(req.Email), num, 1*time.Minute).Result()
	if err != nil {
		return errors.Wrapf(errorz.NewErrCode(errorz.EMAIL_SEND_ERROR), "email:%s,err:%v", req.Email, err)
	}
	if !success {
		return errors.New("验证码未过期")
	}
	m.SetBody("text/html", "您的验证码为：<h1>"+n+"</h1>")

	d := gomail.NewDialer(es.Host, Port, es.Username, es.Password)

	err = d.DialAndSend(m)
	if err != nil {
		return errors.Wrapf(errorz.NewErrCode(errorz.EMAIL_SEND_ERROR), "email:%s,err:%v", req.Email, err)
	}
	return nil
}
