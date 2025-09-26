package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
)

var _ SessionModel = (*customSessionModel)(nil)

type (
	// SessionModel is an interface to be customized, add more methods here,
	// and implement the added methods in customSessionModel.
	SessionModel interface {
		sessionModel
		customSessionLogicModel
	}

	customSessionModel struct {
		*defaultSessionModel
	}

	customSessionLogicModel interface {
	}
)

// NewSessionModel returns a model for the database table.
func NewSessionModel(conn *gorm.DB, c cache.CacheConf) SessionModel {
	return &customSessionModel{
		defaultSessionModel: newSessionModel(conn, c),
	}
}
func (m *defaultSessionModel) getNewModelNeedReloadCacheKeys(data *Session) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}
func (m *defaultSessionModel) customCacheKeys(data *Session) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}

func (m *defaultSessionModel) Find(ctx context.Context, cursor int64, pageSize int64) ([]*Session, error) {
	var resp []*Session
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Session{}).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultSessionModel) FindByQuery(ctx context.Context, cursor int64, pageSize int64, query map[string]interface{}) ([]*Session, error) {
	var resp []*Session
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Session{}).Where("id > ?", cursor).Where(query).Limit(int(pageSize)).Order("id ASC").Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultSessionModel) FuzzyFind(ctx context.Context, cursor int64, pageSize int64, title string, keyword string) ([]*Session, error) {
	var resp []*Session
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		query := fmt.Sprintf("`%s` LIKE ?", title)
		return conn.Model(&Session{}).Where(query, "%"+keyword+"%").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}
