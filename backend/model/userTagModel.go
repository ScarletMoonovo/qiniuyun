package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
)

var _ UserTagModel = (*customUserTagModel)(nil)

type (
	// UserTagModel is an interface to be customized, add more methods here,
	// and implement the added methods in customUserTagModel.
	UserTagModel interface {
		userTagModel
		customUserTagLogicModel
	}

	customUserTagModel struct {
		*defaultUserTagModel
	}

	customUserTagLogicModel interface {
	}
)

// NewUserTagModel returns a model for the database table.
func NewUserTagModel(conn *gorm.DB, c cache.CacheConf) UserTagModel {
	return &customUserTagModel{
		defaultUserTagModel: newUserTagModel(conn, c),
	}
}
func (m *defaultUserTagModel) getNewModelNeedReloadCacheKeys(data *UserTag) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}
func (m *defaultUserTagModel) customCacheKeys(data *UserTag) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}

func (m *defaultUserTagModel) Find(ctx context.Context, cursor int64, pageSize int64) ([]*UserTag, error) {
	var resp []*UserTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&UserTag{}).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultUserTagModel) FindByUserId(ctx context.Context, userId int64) ([]*UserTag, error) {
	var resp []*UserTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&UserTag{}).Where("user_id = ?", userId).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultUserTagModel) FindByQuery(ctx context.Context, cursor int64, pageSize int64, query map[string]interface{}) ([]*UserTag, error) {
	var resp []*UserTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&UserTag{}).Where(query).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultUserTagModel) FuzzyFind(ctx context.Context, cursor int64, pageSize int64, title string, keyword string) ([]*UserTag, error) {
	var resp []*UserTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		query := fmt.Sprintf("`%s` LIKE ?", title)
		return conn.Model(&UserTag{}).Where(query, "%"+keyword+"%").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}
