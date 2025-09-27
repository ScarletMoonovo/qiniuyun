package globalkey

import (
	"fmt"
)

// Email 邮箱验证码key
func Email(email string) string {
	return fmt.Sprintf("roletalk:email:%s", email)
}

// Collection 收藏夹key
func Collection(characterId int64) string {
	return fmt.Sprintf("roletalk_collection_%d", characterId)
}
