package chat

import (
	"github.com/gorilla/websocket"
	"net/http"
	"qiniuyun/backend/common/response"

	"github.com/zeromicro/go-zero/rest/httpx"
	"qiniuyun/backend/app/internal/logic/chat"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源
	},
}

func ChatHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ChatRequest
		if err := httpx.Parse(r, &req); err != nil {
			response.ParamErrorResult(r, w, err)
			return
		}

		err := svcCtx.Validate.StructCtx(r.Context(), req)
		if err != nil {
			response.Response(r, w, nil, err)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()
		l := chat.NewChatLogic(r.Context(), svcCtx)
		err = l.Chat(&req, conn)
		if err != nil {
			conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(
				websocket.CloseInternalServerErr, err.Error(),
			))
		}
	}
}
