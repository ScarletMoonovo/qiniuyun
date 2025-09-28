package character

import (
	"context"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
	"qiniuyun/backend/app/internal/svc"
	"qiniuyun/backend/app/internal/types"
	"qiniuyun/backend/common/ctxdata"
	"qiniuyun/backend/common/globalkey"
	"qiniuyun/backend/common/llm"
	"qiniuyun/backend/model"
)

type NewCharacterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewNewCharacterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *NewCharacterLogic {
	return &NewCharacterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *NewCharacterLogic) NewCharacter(req *types.NewCharacterRequest) (resp *types.NewCharacterResponse, err error) {
	userId := ctxdata.GetUidFromCtx(l.ctx)
	character := &model.Character{
		UserId:      userId,
		Name:        req.Name,
		Description: req.Description,
		Background:  req.Background,
		OpenLine:    req.OpenLine,
		AvatarUrl:   req.Avatar,
		Voice:       req.Voice,
		IsPublic:    castBool(req.IsPublic),
	}
	err = l.svcCtx.CharacterModel.Transaction(l.ctx, func(db *gorm.DB) error {
		e := l.svcCtx.CharacterModel.Insert(l.ctx, db, character)
		if e != nil {
			return e
		}
		ct := make([]model.CharacterTag, 0)
		for i := 0; i < len(req.Tags); i++ {
			ct = append(ct, model.CharacterTag{
				CharacterId: character.Id,
				TagId:       req.Tags[i],
			})
		}
		e = l.svcCtx.CharacterTagModel.Inserts(l.ctx, db, &ct)
		return e
	})
	if err != nil {
		return nil, err
	}
	// 异步生成并更新
	go func() {
		personality, memory, systemPrompt, err := generateCharacterData(l.svcCtx.LLM, req)
		if err != nil {
			logx.Error(err)
			return
		}
		character.Personality = personality
		character.InitialMemory = memory
		character.SystemPrompt = systemPrompt
		err = l.svcCtx.CharacterModel.Update(context.Background(), nil, character)
		if err != nil {
			logx.Error(err)
		}
		var vectors [][]float32
		for _, m := range memory {
			vector, e := l.svcCtx.Embedding.GetEmbedding(m)
			if e != nil {
				logx.Error(e)
				return
			}
			vectors = append(vectors, vector)
		}
		err = l.svcCtx.Embedding.InsertVectors(context.Background(), globalkey.Collection(character.Id), memory, vectors)
		if err != nil {
			logx.Error(err)
			return
		}
	}()
	return &types.NewCharacterResponse{
		Character: castCharacter(character),
	}, nil
}

func generateCharacterData(llm *llm.Client, req *types.NewCharacterRequest) (personality, memory []string, systemPrompt string, err error) {
	personality, err = llm.GeneratePersonality(req.Description, req.Background)
	if err != nil {
		return
	}
	memory, err = llm.GenerateInitialMemory(req.Background)
	if err != nil {
		return
	}
	systemPrompt, err = llm.GenerateSystemPrompt(req.Name, req.Description, personality)
	return
}

func castBool(b bool) int64 {
	if b {
		return 1
	}
	return 0
}
