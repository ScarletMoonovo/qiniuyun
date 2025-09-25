package ctxdata

import (
	"context"
	"github.com/zeromicro/go-zero/core/logx"
)

const (
	CtxKeyJwtUserId = "id"
)

func GetUidFromCtx(ctx context.Context) int64 {
	uid := ctx.Value(CtxKeyJwtUserId)
	if resUid, ok := uid.(int64); ok {
		return resUid
	}
	logx.WithContext(ctx).Error("GetUidFromCtx err: not int value")
	return 0
}
