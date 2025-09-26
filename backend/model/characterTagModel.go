package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
)

var _ CharacterTagModel = (*customCharacterTagModel)(nil)

type (
	// CharacterTagModel is an interface to be customized, add more methods here,
	// and implement the added methods in customCharacterTagModel.
	CharacterTagModel interface {
		characterTagModel
		customCharacterTagLogicModel
	}

	customCharacterTagModel struct {
		*defaultCharacterTagModel
	}

	customCharacterTagLogicModel interface {
	}
)

// NewCharacterTagModel returns a model for the database table.
func NewCharacterTagModel(conn *gorm.DB, c cache.CacheConf) CharacterTagModel {
	return &customCharacterTagModel{
		defaultCharacterTagModel: newCharacterTagModel(conn, c),
	}
}
func (m *defaultCharacterTagModel) getNewModelNeedReloadCacheKeys(data *CharacterTag) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}
func (m *defaultCharacterTagModel) customCacheKeys(data *CharacterTag) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}

func (m *defaultCharacterTagModel) Find(ctx context.Context, cursor int64, pageSize int64) ([]*CharacterTag, error) {
	var resp []*CharacterTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&CharacterTag{}).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultCharacterTagModel) FindByQuery(ctx context.Context, cursor int64, pageSize int64, query map[string]interface{}) ([]*CharacterTag, error) {
	var resp []*CharacterTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&CharacterTag{}).Where(query).Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultCharacterTagModel) FuzzyFind(ctx context.Context, cursor int64, pageSize int64, title string, keyword string) ([]*CharacterTag, error) {
	var resp []*CharacterTag
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		query := fmt.Sprintf("`%s` LIKE ?", title)
		return conn.Model(&CharacterTag{}).Where(query, "%"+keyword+"%").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultCharacterTagModel) Inserts(ctx context.Context, tx *gorm.DB, data *[]CharacterTag) error {
	err := m.ExecNoCacheCtx(ctx, func(conn *gorm.DB) error {
		db := conn
		if tx != nil {
			db = tx
		}
		return db.Create(&data).Error
	})
	return err
}
