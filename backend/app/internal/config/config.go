package config

import (
	"github.com/SpectatorNan/gorm-zero/gormc/config/mysql"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/rest"
)

type Config struct {
	rest.RestConf
	JwtAuth struct {
		AccessSecret string
		AccessExpire int64
	}
	Redis struct {
		Host     string
		Password string
	}
	Kafka struct {
		Topic string
		Addr  []string
	}
	Mysql        mysql.Mysql
	CacheRedis   cache.CacheConf
	EmailService EmailService
}

type EmailService struct {
	From     string
	Addr     string
	Password string
	Host     string
	Username string
}
