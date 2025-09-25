package user

import (
	"net/http"
	"qiniuyun/backend/common/response"

	"github.com/zeromicro/go-zero/rest/httpx"
	"qiniuyun/backend/app/internal/logic/user"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
)

func UpdateUserinfoHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.User
		if err := httpx.Parse(r, &req); err != nil {
			response.ParamErrorResult(r, w, err)
			return
		}

		err := svcCtx.Validate.StructCtx(r.Context(), req)
		if err != nil {
			response.Response(r, w, nil, err)
			return
		}

		l := user.NewUpdateUserinfoLogic(r.Context(), svcCtx)
		err = l.UpdateUserinfo(&req)
		response.Response(r, w, nil, err)
	}
}
