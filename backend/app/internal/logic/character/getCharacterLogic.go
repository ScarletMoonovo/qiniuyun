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
	if req.UserId != 0 {
		characters, err := l.svcCtx.CharacterModel.FindByQuery(l.ctx, 0, req.PageSize, map[string]interface{}{"user_id": req.UserId})
		if err != nil {
			return nil, err
		}
		return &types.GetCharacterResponse{
			Characters: l.castCharacters(characters),
		}, nil
	}
	if req.Tag == 0 {
		characters, err := l.svcCtx.CharacterModel.GetRandom(l.ctx, req.PageSize)
		if err != nil {
			return nil, err
		}
		return &types.GetCharacterResponse{
			Characters: l.castCharacters(characters),
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
		Characters: l.castCharacters(characters),
	}, nil
}

func (l *GetCharacterLogic) castCharacters(characters []*model.Character) (resp []types.Character) {
	resp = make([]types.Character, 0)
	for _, character := range characters {
		one, _ := l.svcCtx.UserModel.FindOne(l.ctx, character.UserId)
		tags, _ := l.svcCtx.CharacterTagModel.FindByQuery(l.ctx, 0, 3, map[string]interface{}{"character_id": character.Id})
		c := castCharacter(character)
		c.UserName = one.Name
		for _, tag := range tags {
			tagName, _ := l.svcCtx.TagModel.FindOne(l.ctx, tag.TagId)
			c.Tags = append(c.Tags, tagName.Name)
		}
		resp = append(resp, c)
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
