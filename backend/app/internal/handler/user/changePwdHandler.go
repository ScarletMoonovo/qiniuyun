package user

import (
	"net/http"
	"qiniuyun/backend/common/response"

	"github.com/zeromicro/go-zero/rest/httpx"
	"qiniuyun/backend/app/internal/logic/user"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
)

func ChangePwdHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ChangePwdRequest
		if err := httpx.Parse(r, &req); err != nil {
			response.ParamErrorResult(r, w, err)
			return
		}

		err := svcCtx.Validate.StructCtx(r.Context(), req)
		if err != nil {
			response.Response(r, w, nil, err)
			return
		}

		l := user.NewChangePwdLogic(r.Context(), svcCtx)
		err = l.ChangePwd(&req)
		response.Response(r, w, nil, err)
	}
}
