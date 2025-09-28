package logic

import (
	"context"
	"encoding/json"
	"fmt"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/aliyun/alibaba-cloud-sdk-go/sdk"
	"github.com/aliyun/alibaba-cloud-sdk-go/sdk/requests"
	"github.com/zeromicro/go-zero/core/logx"
)

type UploadTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUploadTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UploadTokenLogic {
	return &UploadTokenLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UploadTokenLogic) UploadToken(req *types.UploadTokenRequest) (resp *types.UploadTokenResponse, err error) {
	data, err := getToken(l.svcCtx.Config.Ali.AccessKey, l.svcCtx.Config.Ali.SecretKey)
	if err != nil {
		return nil, err
	}
	return &types.UploadTokenResponse{Token: data.Token.Id, Expire: data.Token.ExpireTime}, nil
}

func getToken(ak, sk string) (*tokenData, error) {
	client, err := sdk.NewClientWithAccessKey("cn-shanghai", ak, sk)
	if err != nil {
		panic(err)
	}
	request := requests.NewCommonRequest()
	request.Method = "POST"
	request.Domain = "nls-meta.cn-shanghai.aliyuncs.com"
	request.ApiName = "CreateToken"
	request.Version = "2019-02-28"
	response, err := client.ProcessCommonRequest(request)
	if err != nil {
		return nil, err
	}
	fmt.Print(response.GetHttpStatus())
	fmt.Print(response.GetHttpContentString())
	var data tokenData
	err = json.Unmarshal(response.GetHttpContentBytes(), &data)
	if err != nil {
		return nil, err
	}
	return &data, nil
}

type tokenData struct {
	ErrMsg string `json:"ErrMsg"`
	Token  struct {
		UserId     string `json:"UserId"`
		Id         string `json:"Id"`
		ExpireTime int64  `json:"ExpireTime"`
	} `json:"Token"`
}
