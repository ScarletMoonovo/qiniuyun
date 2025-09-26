package handler

import (
	"net/http"
	"qiniuyun/backend/common/response"

	"qiniuyun/backend/app/internal/logic"
	"qiniuyun/backend/app/internal/svc"
)

func getTagsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := logic.NewGetTagsLogic(r.Context(), svcCtx)
		resp, err := l.GetTags()
		response.Response(r, w, resp, err)
	}
}
