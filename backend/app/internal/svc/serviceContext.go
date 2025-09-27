package svc

import (
	"github.com/SpectatorNan/gorm-zero/gormc/config/mysql"
	"github.com/go-playground/validator/v10"
	"qiniuyun/backend/common/embedding"
	"qiniuyun/backend/common/llm"

	"github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	"github.com/qdrant/go-client/qdrant"
	"github.com/zeromicro/go-zero/rest"
	"qiniuyun/backend/app/internal/config"
	"qiniuyun/backend/app/internal/middleware"
	"qiniuyun/backend/common/auth"
	"qiniuyun/backend/model"
)

type ServiceContext struct {
	Config            config.Config
	Auth              rest.Middleware
	Token             rest.Middleware
	Redis             *redis.Client
	Validate          *validator.Validate
	UserModel         model.UserModel
	CharacterModel    model.CharacterModel
	TagModel          model.TagModel
	UserTagModel      model.UserTagModel
	CharacterTagModel model.CharacterTagModel
	SessionModel      model.SessionModel
	MessageModel      model.MessageModel
	LLM               *llm.Client
	Embedding         *embedding.Client
}

func NewServiceContext(c config.Config) *ServiceContext {
	auth.Secret(c.JwtAuth.AccessSecret)
	db, err := mysql.Connect(c.Mysql)
	if err != nil {
		panic(err)
	}

	qdrantClient, err := qdrant.NewClient(&qdrant.Config{
		Host:   c.Qdrant.Host,
		Port:   c.Qdrant.Port,
		UseTLS: false,
	})
	if err != nil {
		panic(err)
	}

	return &ServiceContext{
		Config:            c,
		Validate:          validator.New(),
		Auth:              middleware.AuthMiddleware(),
		Token:             middleware.TokenMiddleware(),
		Redis:             redis.NewClient(&redis.Options{Addr: c.Redis.Host, Password: c.Redis.Password}),
		UserModel:         model.NewUserModel(db, c.CacheRedis),
		CharacterModel:    model.NewCharacterModel(db, c.CacheRedis),
		TagModel:          model.NewTagModel(db, c.CacheRedis),
		UserTagModel:      model.NewUserTagModel(db, c.CacheRedis),
		CharacterTagModel: model.NewCharacterTagModel(db, c.CacheRedis),
		SessionModel:      model.NewSessionModel(db, c.CacheRedis),
		MessageModel:      model.NewMessageModel(db, c.CacheRedis),
		LLM:               llm.New(c.LLM.ApiKey, c.LLM.Model, c.LLM.BaseURL),
		Embedding:         embedding.New(c.Embedding.BaseURL, qdrantClient),
	}
}
