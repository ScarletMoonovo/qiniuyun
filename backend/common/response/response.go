package response

import (
	"fmt"
	"github.com/pkg/errors"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"
	"google.golang.org/grpc/status"
	"net/http"
	"qiniuyun/backend/common/errorz"
)

type Body struct {
	Code uint32 `json:"code"`
	Msg  string `json:"msg"`
	Data any    `json:"data,omitempty"`
}

func Success(resp any) *Body {
	return &Body{Code: 0, Msg: "successful", Data: resp}
}

func Error(code uint32, msg string) *Body {
	return &Body{Code: code, Msg: msg}
}

// Response 确保http返回格式统一
func Response(r *http.Request, w http.ResponseWriter, resp any, err error) {
	if err == nil {
		//成功返回
		re := Success(resp)
		httpx.WriteJson(w, http.StatusOK, re)
	} else {
		//错误返回
		errcode := errorz.SERVER_COMMON_ERROR
		errmsg := "服务器开小差啦，稍后再来试一试"

		causeErr := errors.Cause(err)                  // err类型
		if e, ok := causeErr.(*errorz.CodeError); ok { //http 自定义错误类型
			//自定义CodeError
			errcode = e.GetErrCode()
			errmsg = e.GetErrMsg()
		} else {
			if gstatus, ok := status.FromError(causeErr); ok { // grpc err错误
				grpcCode := uint32(gstatus.Code())
				if errorz.IsCodeErr(grpcCode) { //区分自定义错误跟系统错误，系统错误不能返回给前端
					errcode = grpcCode
					errmsg = gstatus.Message()
				}
			}
		}

		logx.WithContext(r.Context()).Errorf("【API-ERR】 : %+v ", err)

		httpx.WriteJson(w, http.StatusBadRequest, Error(errcode, errmsg))
	}
}

// JwtUnauthorizedResult 确保jwt鉴权错误返回格式统一
func JwtUnauthorizedResult(w http.ResponseWriter) {
	httpx.WriteJson(w, http.StatusUnauthorized, &Body{401, "鉴权失败", nil})
}

// ParamErrorResult 确保 http 参数错误返回格式统一
func ParamErrorResult(r *http.Request, w http.ResponseWriter, err error) {
	errMsg := fmt.Sprintf("%s ,%s", errorz.MapErrMsg(errorz.REUQEST_PARAM_ERROR), err.Error())
	logx.WithContext(r.Context()).Errorf("【PARAM-ERR】 : %+v ", err)
	httpx.WriteJson(w, http.StatusBadRequest, Error(errorz.REUQEST_PARAM_ERROR, errMsg))
}
