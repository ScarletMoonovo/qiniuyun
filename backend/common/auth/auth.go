package auth

import (
	"context"
	"github.com/golang-jwt/jwt/v4"
	"github.com/pkg/errors"
	"github.com/zeromicro/go-zero/rest"
	"net/http"
	"qiniuyun/backend/common/response"
	"time"
)

type Claims struct {
	Id   int64 `json:"id"`
	Role int   `json:"role"`
	jwt.RegisteredClaims
}

var (
	keyfunc jwt.Keyfunc
	secret  []byte
)

func Secret(secretKey string) jwt.Keyfunc {
	secret = []byte(secretKey)
	keyfunc = func(token *jwt.Token) (interface{}, error) {
		return secret, nil // 这是我的secret
	}
	return keyfunc
}

// GetJwtToken @secretKey: JWT 加解密密钥
// @iat: 时间戳
// @seconds: 过期时间，单位秒
// @payload: 数据载体
func GetJwtToken(seconds, id int64, role int) (accessToken string, refreshToken string, err error) {
	accessClaim := Claims{
		Id:   id,
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Unix(time.Now().Unix()+seconds, 0)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()), // 生效时间
		}}
	accessT := jwt.New(jwt.SigningMethodHS256)
	accessT.Claims = accessClaim
	accessToken, err = accessT.SignedString(secret)
	if err != nil {
		return "", "", errors.Wrap(err, "accessToken created error")
	}
	refreshClaims := make(jwt.MapClaims)
	refreshClaims["exp"] = time.Now().Unix() + 2*seconds
	refreshClaims["iat"] = time.Now().Unix()
	refreshT := jwt.New(jwt.SigningMethodHS256)
	refreshT.Claims = refreshClaims
	refreshToken, err = refreshT.SignedString(secret)
	if err != nil {
		return "", "", errors.Wrap(err, "refreshToken created error")
	}
	return
}

func ParseJwtToken(Token string) (*Claims, error) {
	claim := Claims{}
	token, err := jwt.ParseWithClaims(Token, &claim, keyfunc)
	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorMalformed != 0 {
				return nil, errors.New("that's not even a token")
			} else if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, errors.New("token is expired")
			} else if ve.Errors&jwt.ValidationErrorNotValidYet != 0 {
				return nil, errors.New("token not active yet")
			} else {
				return nil, errors.New("couldn't handle this token")
			}
		}
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("couldn't handle this token")
}

func AuthMiddleware() rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get("Authorization")
			claim, err := ParseJwtToken(token)
			if err != nil {
				response.JwtUnauthorizedResult(w)
				return
			}
			reqCtx := r.Context()
			idCtx := context.WithValue(reqCtx, "id", claim.Id)
			ctx := context.WithValue(idCtx, "role", claim.Role)
			newReq := r.WithContext(ctx)
			next(w, newReq)
		}
	}
}

func TokenMiddleware() rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get("Authorization")
			claim, err := ParseJwtToken(token)
			if err != nil {
				next(w, r)
				return
			}
			reqCtx := r.Context()
			idCtx := context.WithValue(reqCtx, "id", claim.Id)
			ctx := context.WithValue(idCtx, "role", claim.Role)
			newReq := r.WithContext(ctx)
			next(w, newReq)
		}
	}
}

type WSAuthRequest struct {
	Token string `json:"token"`
}

func ValidateWs(req WSAuthRequest) (int64, error) {
	claim, err := ParseJwtToken(req.Token)
	if err != nil {
		return 0, err
	}
	return claim.Id, nil
}
