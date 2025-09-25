package middleware

import (
	"github.com/zeromicro/go-zero/rest"
	"qiniuyun/backend/common/auth"
)

func AuthMiddleware() rest.Middleware {
	return auth.AuthMiddleware()
}
