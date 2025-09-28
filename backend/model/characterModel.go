package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
	"math/rand"
)

var _ CharacterModel = (*customCharacterModel)(nil)

type (
	// CharacterModel is an interface to be customized, add more methods here,
	// and implement the added methods in customCharacterModel.
	CharacterModel interface {
		characterModel
		customCharacterLogicModel
	}

	customCharacterModel struct {
		*defaultCharacterModel
	}

	customCharacterLogicModel interface {
	}
)

// NewCharacterModel returns a model for the database table.
func NewCharacterModel(conn *gorm.DB, c cache.CacheConf) CharacterModel {
	return &customCharacterModel{
		defaultCharacterModel: newCharacterModel(conn, c),
	}
}
func (m *defaultCharacterModel) getNewModelNeedReloadCacheKeys(data *Character) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}
func (m *defaultCharacterModel) customCacheKeys(data *Character) []string {
	if data == nil {
		return []string{}
	}
	return []string{}
}

func (m *defaultCharacterModel) Find(ctx context.Context, cursor int64, pageSize int64) ([]*Character, error) {
	var resp []*Character
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Character{}).Limit(int(pageSize)).Offset(int(cursor)).Where("is_public = TRUE").Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultCharacterModel) FindByQuery(ctx context.Context, cursor int64, pageSize int64, query map[string]interface{}) ([]*Character, error) {
	var resp []*Character
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		return conn.Model(&Character{}).Where(query).Where("is_public = TRUE").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultCharacterModel) FuzzyFind(ctx context.Context, cursor int64, pageSize int64, title string, keyword string) ([]*Character, error) {
	var resp []*Character
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		query := fmt.Sprintf("`%s` LIKE ?", title)
		return conn.Model(&Character{}).Where(query, "%"+keyword+"%").Where("is_public = TRUE").Limit(int(pageSize)).Offset(int(cursor)).Find(&resp).Error
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (m *defaultCharacterModel) GetRandom(ctx context.Context, n int64) ([]*Character, error) {
	var resp []*Character
	uniqueIds := make(map[int64]struct{})
	var count int64

	err := m.QueryNoCacheCtx(ctx, nil, func(db *gorm.DB, v interface{}) error {
		return db.Model(&Character{}).Count(&count).Error
	})
	if err != nil {
		return nil, err
	}
	if count == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	for i := int64(0); int64(len(uniqueIds)) < n && i < n+3; i++ {
		offset := rand.Intn(int(count))
		var result Character
		err := m.QueryNoCacheCtx(ctx, nil, func(db *gorm.DB, v interface{}) error {
			return db.
				Offset(offset).
				Limit(1).
				First(&result).Error
		})
		if err != nil {
			return nil, err
		}
		if _, exists := uniqueIds[result.Id]; !exists {
			uniqueIds[result.Id] = struct{}{}
			resp = append(resp, &result)
		}
	}
	return resp, nil
}
