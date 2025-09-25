package crypt

import (
	"golang.org/x/crypto/bcrypt"
	"unsafe"
)

func EncryptBcrypt(pwd string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword(*(*[]byte)(unsafe.Pointer(&pwd)), bcrypt.DefaultCost)
	hash := *(*string)(unsafe.Pointer(&bytes))
	return hash, err
}

func ValidateBcrypt(pwd1 string, pwd2 string) bool {
	p1, p2 := *(*[]byte)(unsafe.Pointer(&pwd1)), *(*[]byte)(unsafe.Pointer(&pwd2))
	err := bcrypt.CompareHashAndPassword(p1, p2)
	if err != nil {
		return false
	} else {
		return true
	}
}
