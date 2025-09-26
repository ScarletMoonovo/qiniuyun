package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
)

var _ MessageModel = (*customMessageModel)(nil)

type (
	// MessageModel is an interface to be customized, add more methods here,
	// and implement the added methods in customMessageModel.
	MessageModel interface {
		messageModel
		customMessageLogicModel
	}

	customMessageModel struct {
		*defaultMessageModel
	}

	customMessageLogicModel interface {
	}
)

// NewMessageModel returns a model for the database table.
func NewMessageModel(conn *gorm.DB, c cache.CacheConf) MessageModel {
	return &customMessageModel{
		defaultMessageModel: newMessageModel(conn, c),
	}
}
func (m *defaultMessageModel) getNewModelNeedReloadCacheKeys(data *Message) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}
func (m *defaultMessageModel) customCacheKeys(data *Message) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}

func (m *defaultMessageModel) Find(ctx context.Context, cursor int64, pageSize int64) ([]*Message, error) {
	var resp []*Message
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Message{}).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultMessageModel) FindByQuery(ctx context.Context, cursor int64, pageSize int64, query map[string]interface{}) ([]*Message, error) {
	var resp []*Message
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Message{}).Where(query).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultMessageModel) FuzzyFind(ctx context.Context, cursor int64, pageSize int64, title string, keyword string) ([]*Message, error) {
	var resp []*Message
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		query := fmt.Sprintf("`%s` LIKE ?", title)
		return conn.Model(&Message{}).Where(query, "%"+keyword+"%").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultMessageModel) FindBySession(ctx context.Context, sessionId int64) ([]*Message, error) {
	var resp []*Message
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Message{}).Where("session_id = ?", sessionId).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}
