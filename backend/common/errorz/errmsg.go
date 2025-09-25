package errorz

var message map[uint32]string

func init() {
	message = make(map[uint32]string)
	//全局模块
	message[OK] = "SUCCESS"
	message[SERVER_COMMON_ERROR] = "服务器开小差啦,稍后再来试一试"
	message[REUQEST_PARAM_ERROR] = "参数错误"
	message[DB_ERROR] = "数据库繁忙,请稍后再试"
	message[REQUEST_ROLE_ERROR] = "权限不足"
	message[SENSITIVE_WORDS_ERROR] = "敏感单词"
	//用户模块
	message[EMAIL_SEND_ERROR] = "邮件发送失败,请稍后再试"
	message[CAPTCHA_VALIDATE_ERROR] = "验证码错误"
	message[PASSWORD_VALIDATE_ERROR] = "密码错误"
}

func MapErrMsg(errcode uint32) string {
	if msg, ok := message[errcode]; ok {
		return msg
	} else {
		return "服务器开小差啦,稍后再来试一试"
	}
}

func IsCodeErr(errcode uint32) bool {
	if _, ok := message[errcode]; ok {
		return true
	} else {
		return false
	}
}
