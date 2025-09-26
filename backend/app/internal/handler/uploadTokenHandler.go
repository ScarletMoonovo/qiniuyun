package handler

import (
	"net/http"
	"qiniuyun/backend/common/response"

	"qiniuyun/backend/app/internal/logic"
	"qiniuyun/backend/app/internal/svc"
)

func uploadTokenHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := logic.NewUploadTokenLogic(r.Context(), svcCtx)
		resp, err := l.UploadToken()
		response.Response(r, w, resp, err)
	}
}
