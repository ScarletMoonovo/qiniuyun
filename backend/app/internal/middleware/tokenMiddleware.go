package middleware

import (
	"github.com/zeromicro/go-zero/rest"
	"qiniuyun/backend/common/auth"
)

// TokenMiddleware 未登录也可以访问，如果已登录即解析id，role并放入context
func TokenMiddleware() rest.Middleware {
	return auth.TokenMiddleware()
}
