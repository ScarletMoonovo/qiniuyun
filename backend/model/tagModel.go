package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
)

var _ TagModel = (*customTagModel)(nil)

type (
	// TagModel is an interface to be customized, add more methods here,
	// and implement the added methods in customTagModel.
	TagModel interface {
		tagModel
		customTagLogicModel
	}

	customTagModel struct {
		*defaultTagModel
	}

	customTagLogicModel interface {
	}
)

// NewTagModel returns a model for the database table.
func NewTagModel(conn *gorm.DB, c cache.CacheConf) TagModel {
	return &customTagModel{
		defaultTagModel: newTagModel(conn, c),
	}
}
func (m *defaultTagModel) getNewModelNeedReloadCacheKeys(data *Tag) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}
func (m *defaultTagModel) customCacheKeys(data *Tag) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}

func (m *defaultTagModel) Find(ctx context.Context, cursor int64, pageSize int64) ([]*Tag, error) {
	var resp []*Tag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Tag{}).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultTagModel) FindAll(ctx context.Context) ([]*Tag, error) {
	var resp []*Tag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Tag{}).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultTagModel) FindByQuery(ctx context.Context, cursor int64, pageSize int64, query map[string]interface{}) ([]*Tag, error) {
	var resp []*Tag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Tag{}).Where(query).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultTagModel) FuzzyFind(ctx context.Context, cursor int64, pageSize int64, title string, keyword string) ([]*Tag, error) {
	var resp []*Tag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		query := fmt.Sprintf("`%s` LIKE ?", title)
		return conn.Model(&Tag{}).Where(query, "%"+keyword+"%").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}
