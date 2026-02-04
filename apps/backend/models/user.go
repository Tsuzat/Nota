package models

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	Id                              string    `json:"id" pg:"id,type:uuid"`
	Email                           string    `json:"email" pg:"email"`
	Name                            string    `json:"name" pg:"name"`
	AvatarUrl                       string    `json:"avatar_url" pg:"avatar_url"`
	Provider                        string    `json:"provider" pg:"provider"`
	ProviderId                      string    `json:"provider_id" pg:"provider_id"`
	CreatedAt                       time.Time `json:"created_at" pg:"created_at"`
	UpdatedAt                       time.Time `json:"updated_at" pg:"updated_at"`
	IsVerified                      bool      `json:"is_verified" pg:"is_verified"`
	SubscriptionPlan                string    `json:"subscription_plan" pg:"subscription_plan"`
	AiCredits                       int       `json:"ai_credits" pg:"ai_credits"`
	SubscriptionType                string    `json:"subscription_type" pg:"subscription_type"`
	ExternalCustomerId              string    `json:"external_customer_id" pg:"external_customer_id"`
	Password                        string    `json:"password" pg:"encrypted_password"`
	EmailVerified                   bool      `json:"email_verified" pg:"email_verified"`
	EmailVerifiedAt                 time.Time `json:"email_verified_at" pg:"email_verified_at"`
	EmailVerificationToken          string    `json:"email_verification_token" pg:"email_verification_token"`
	EmailVerificationTokenExpiresAt time.Time `json:"email_verification_token_expires_at" pg:"email_verification_token_expires_at"`
	AssignedStorage                 int64     `json:"assigned_storage" pg:"assigned_storage"`
	UsedStorage                     int64     `json:"used_storage" pg:"used_storage"`
	NextBillingAt                   time.Time `json:"next_billing_at" pg:"next_billing_at"`
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
