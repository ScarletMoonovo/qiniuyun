package model

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/stores/cache"
	"gorm.io/gorm"
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

var (
	characterRandomSql = `SELECT *
        FROM character AS t1
        JOIN (
            SELECT ROUND(
                RAND() * ((SELECT MAX(id) FROM character) - (SELECT MIN(id) FROM character)) 
                + (SELECT MIN(id) FROM character)
            ) AS id
        ) AS t2
        WHERE t1.id >= t2.id AND t1.is_public = TRUE
        ORDER BY t1.id
        LIMIT 1`
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
	idSet := make(map[int64]struct{})
	err := m.QueryNoCacheCtx(ctx, &resp, func(conn *gorm.DB, v interface{}) error {
		count := int64(0)
		for i := int64(0); count < n && i < n+3; i++ {
			var rsp Character
			err := conn.Raw(characterRandomSql).Scan(&rsp).Error
			if err != nil {
				return err
			}
			if _, exists := idSet[rsp.Id]; !exists {
				idSet[rsp.Id] = struct{}{}
				resp = append(resp, &rsp)
				count++
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}
