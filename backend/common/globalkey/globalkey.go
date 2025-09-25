package globalkey

import (
	"fmt"
)

// Email 邮箱验证码key
func Email(email string) string {
	return fmt.Sprintf("media:email:%s", email)
}
