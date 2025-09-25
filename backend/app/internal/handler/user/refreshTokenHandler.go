package user

import (
	"net/http"
	"qiniuyun/backend/common/response"

	"qiniuyun/backend/app/internal/logic/user"
	"qiniuyun/backend/app/internal/svc"
)

func RefreshTokenHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user.NewRefreshTokenLogic(r.Context(), svcCtx)
		token := r.Header.Get("Authorization")
		resp, err := l.RefreshToken(token)
		response.Response(r, w, resp, err)
	}
}
