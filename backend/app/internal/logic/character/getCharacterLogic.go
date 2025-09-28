package character

import (
	"context"
	"qiniuyun/backend/model"

	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetCharacterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetCharacterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetCharacterLogic {
	return &GetCharacterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetCharacterLogic) GetCharacter(req *types.GetCharacterRequest) (resp *types.GetCharacterResponse, err error) {
	if req.Tag == 0 {
		characters, err := l.svcCtx.CharacterModel.GetRandom(l.ctx, req.PageSize)
		if err != nil {
			return nil, err
		}
		return &types.GetCharacterResponse{
			Characters: castCharacters(characters),
		}, nil
	}
	characterIds := make([]int64, 0)
	random, err := l.svcCtx.CharacterTagModel.GetRandom(l.ctx, req.PageSize, req.Tag)
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(random); i++ {
		characterIds = append(characterIds, random[i].CharacterId)
	}
	characters, err := l.svcCtx.CharacterModel.FindIn(l.ctx, characterIds)
	if err != nil {
		return nil, err
	}
	return &types.GetCharacterResponse{
		Characters: castCharacters(characters),
	}, nil
}

func castCharacters(characters []*model.Character) (resp []types.Character) {
	resp = make([]types.Character, 0)
	for _, character := range characters {
		resp = append(resp, castCharacter(character))
	}
	return resp
}

func castCharacter(character *model.Character) (resp types.Character) {
	return types.Character{
		Id:          character.Id,
		Name:        character.Name,
		Description: character.Description,
		Background:  character.Background,
		OpenLine:    character.OpenLine,
		Avatar:      character.AvatarUrl,
	}
}
