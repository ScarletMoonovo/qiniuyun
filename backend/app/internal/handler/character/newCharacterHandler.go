package character

import (
	"net/http"
	"qiniuyun/backend/common/response"

	"github.com/zeromicro/go-zero/rest/httpx"
	"qiniuyun/backend/app/internal/logic/character"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
)

func NewCharacterHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.NewCharacterRequest
		if err := httpx.Parse(r, &req); err != nil {
			response.ParamErrorResult(r, w, err)
			return
		}

		err := svcCtx.Validate.StructCtx(r.Context(), req)
		if err != nil {
			response.Response(r, w, nil, err)
			return
		}

		l := character.NewNewCharacterLogic(r.Context(), svcCtx)
		resp, err := l.NewCharacter(&req)
		response.Response(r, w, resp, err)
	}
}
