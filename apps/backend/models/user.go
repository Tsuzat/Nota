package models

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users"`

	Id                              string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Email                           string    `json:"email" bun:"email,unique,notnull"`
	Name                            string    `json:"name" bun:"name"`
	AvatarUrl                       string    `json:"avatar_url" bun:"avatar_url"`
	Provider                        string    `json:"provider" bun:"provider,notnull"`
	ProviderId                      string    `json:"provider_id" bun:"provider_id"`
	CreatedAt                       time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt                       time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`
	IsVerified                      bool      `json:"is_verified" bun:"is_verified,notnull,default:false"`
	SubscriptionPlan                string    `json:"subscription_plan" bun:"subscription_plan,notnull,default:'free'"`
	AiCredits                       int       `json:"ai_credits" bun:"ai_credits,notnull,default:0"`
	SubscriptionType                string    `json:"subscription_type" bun:"subscription_type,nullzero"`
	ExternalCustomerId              string    `json:"external_customer_id" bun:"external_customer_id"`
	Password                        string    `json:"password" bun:"encrypted_password"`
	EmailVerified                   bool      `json:"email_verified" bun:"email_verified,notnull,default:false"`
	EmailVerifiedAt                 time.Time `json:"email_verified_at" bun:"email_verified_at"`
	EmailVerificationToken          string    `json:"email_verification_token" bun:"email_verification_token"`
	EmailVerificationTokenExpiresAt time.Time `json:"email_verification_token_expires_at" bun:"email_verification_token_expires_at"`
	AssignedStorage                 int64     `json:"assigned_storage" bun:"assigned_storage,notnull,default:0"`
	UsedStorage                     int64     `json:"used_storage" bun:"used_storage,notnull,default:0"`
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

func (user *User) UserResponse() any {
	return fiber.Map{
		"id":                   user.Id,
		"email":                user.Email,
		"name":                 user.Name,
		"avatar_url":           user.AvatarUrl,
		"provider":             user.Provider,
		"created_at":           user.CreatedAt,
		"updated_at":           user.UpdatedAt,
		"is_verified":          user.IsVerified,
		"subscription_plan":    user.SubscriptionPlan,
		"ai_credits":           user.AiCredits,
		"subscription_type":    user.SubscriptionType,
		"external_customer_id": user.ExternalCustomerId,
		"email_verified":       user.EmailVerified,
		"assigned_storage":     user.AssignedStorage,
		"used_storage":         user.UsedStorage,
		"next_billing_at":      user.NextBillingAt,
	}
}
