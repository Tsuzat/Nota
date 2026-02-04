package models

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users"`

	Id                              string    `json:"id" bun:"id,type:uuid"`
	Email                           string    `json:"email" bun:"email"`
	Name                            string    `json:"name" bun:"name"`
	AvatarUrl                       string    `json:"avatar_url" bun:"avatar_url"`
	Provider                        string    `json:"provider" bun:"provider"`
	ProviderId                      string    `json:"provider_id" bun:"provider_id"`
	CreatedAt                       time.Time `json:"created_at" bun:"created_at"`
	UpdatedAt                       time.Time `json:"updated_at" bun:"updated_at"`
	IsVerified                      bool      `json:"is_verified" bun:"is_verified"`
	SubscriptionPlan                string    `json:"subscription_plan" bun:"subscription_plan"`
	AiCredits                       int       `json:"ai_credits" bun:"ai_credits"`
	SubscriptionType                string    `json:"subscription_type" bun:"subscription_type"`
	ExternalCustomerId              string    `json:"external_customer_id" bun:"external_customer_id"`
	Password                        string    `json:"password" bun:"encrypted_password"`
	EmailVerified                   bool      `json:"email_verified" bun:"email_verified"`
	EmailVerifiedAt                 time.Time `json:"email_verified_at" bun:"email_verified_at"`
	EmailVerificationToken          string    `json:"email_verification_token" bun:"email_verification_token"`
	EmailVerificationTokenExpiresAt time.Time `json:"email_verification_token_expires_at" bun:"email_verification_token_expires_at"`
	AssignedStorage                 int64     `json:"assigned_storage" bun:"assigned_storage"`
	UsedStorage                     int64     `json:"used_storage" bun:"used_storage"`
	NextBillingAt                   time.Time `json:"next_billing_at" bun:"next_billing_at"`
}

/*
Function to generate JWT Token with user id, email and name
with given JWT_SECRET and JWT_EXPIRY
*/
func (user *User) GenerateAccessToken(sessionId string) (string, error) {

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":         user.Id,
		"email":      user.Email,
		"name":       user.Name,
		"session_id": sessionId,
		"isa":        time.Now().Unix(),
		"exp":        time.Now().Add(time.Minute * time.Duration(config.ACCESS_TOKEN_EXPIRY)).Unix(),
	})
	tokenString, err := token.SignedString([]byte(config.ACCESS_TOKEN_SECRET))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

/*
Function to Update RefreshToken JWT Token with user id
*/
func (user *User) GenerateRefreshToken(sessionId string) (string, error) {

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":         user.Id,
		"session_id": sessionId,
		"isa":        time.Now().Unix(),
		"exp":        time.Now().Add(time.Hour * 24 * time.Duration(config.REFRESH_TOKEN_EXPIRY)).Unix(),
	})
	tokenString, err := token.SignedString([]byte(config.REFRESH_TOKEN_SECRET))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}
