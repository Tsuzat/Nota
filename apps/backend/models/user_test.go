package models

import (
	"testing"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestConfig() {
	config.ACCESS_TOKEN_SECRET = "test-access-secret-key-12345"
	config.ACCESS_TOKEN_EXPIRY = 15 // 15 minutes
	config.REFRESH_TOKEN_SECRET = "test-refresh-secret-key-12345"
	config.REFRESH_TOKEN_EXPIRY = 7 // 7 days
}

func TestGenerateAccessToken(t *testing.T) {
	setupTestConfig()

	user := &User{
		Id:    "user-123",
		Email: "test@example.com",
		Name:  "Test User",
	}
	sessionId := "session-456"

	token, err := user.GenerateAccessToken(sessionId)

	require.NoError(t, err)
	assert.NotEmpty(t, token)

	// Parse and verify the token
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.ACCESS_TOKEN_SECRET), nil
	})

	require.NoError(t, err)
	assert.True(t, parsedToken.Valid)

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	require.True(t, ok)

	assert.Equal(t, user.Id, claims["id"])
	assert.Equal(t, user.Email, claims["email"])
	assert.Equal(t, user.Name, claims["name"])
	assert.Equal(t, sessionId, claims["session_id"])

	// Verify expiration is in the future
	exp, ok := claims["exp"].(float64)
	require.True(t, ok)
	assert.Greater(t, int64(exp), time.Now().Unix())
}

func TestGenerateRefreshToken(t *testing.T) {
	setupTestConfig()

	user := &User{
		Id: "user-123",
	}
	sessionId := "session-456"

	token, err := user.GenerateRefreshToken(sessionId)

	require.NoError(t, err)
	assert.NotEmpty(t, token)

	// Parse and verify the token
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.REFRESH_TOKEN_SECRET), nil
	})

	require.NoError(t, err)
	assert.True(t, parsedToken.Valid)

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	require.True(t, ok)

	assert.Equal(t, user.Id, claims["id"])
	assert.Equal(t, sessionId, claims["session_id"])

	// Verify expiration is set correctly (7 days in the future)
	exp, ok := claims["exp"].(float64)
	require.True(t, ok)
	expectedExp := time.Now().Add(time.Hour * 24 * 7).Unix()
	// Allow 1 minute tolerance
	assert.InDelta(t, expectedExp, int64(exp), 60)
}

func TestUserResponse(t *testing.T) {
	now := time.Now()
	user := &User{
		Id:                 "user-123",
		Email:              "test@example.com",
		Name:               "Test User",
		AvatarUrl:          "https://example.com/avatar.png",
		Provider:           "google",
		CreatedAt:          now,
		UpdatedAt:          now,
		IsVerified:         true,
		SubscriptionPlan:   "pro",
		AiCredits:          2_000_000,
		SubscriptionType:   "monthly",
		ExternalCustomerId: "cust-123",
		EmailVerified:      true,
		AssignedStorage:    1_000_000_000,
		UsedStorage:        500_000_000,
		NextBillingAt:      now.Add(30 * 24 * time.Hour),
	}

	response := user.UserResponse()

	// fiber.Map is a type alias for map[string]any
	responseMap, ok := response.(fiber.Map)
	require.True(t, ok, "Response should be a fiber.Map, got %T", response)

	assert.Equal(t, user.Id, responseMap["id"])
	assert.Equal(t, user.Email, responseMap["email"])
	assert.Equal(t, user.Name, responseMap["name"])
	assert.Equal(t, user.AvatarUrl, responseMap["avatar_url"])
	assert.Equal(t, user.Provider, responseMap["provider"])
	assert.Equal(t, user.IsVerified, responseMap["is_verified"])
	assert.Equal(t, user.SubscriptionPlan, responseMap["subscription_plan"])
	assert.Equal(t, user.AiCredits, responseMap["ai_credits"])
	assert.Equal(t, user.SubscriptionType, responseMap["subscription_type"])
	assert.Equal(t, user.ExternalCustomerId, responseMap["external_customer_id"])
	assert.Equal(t, user.EmailVerified, responseMap["email_verified"])
	assert.Equal(t, user.AssignedStorage, responseMap["assigned_storage"])
	assert.Equal(t, user.UsedStorage, responseMap["used_storage"])
}

func TestGenerateAccessToken_EmptyUserId(t *testing.T) {
	setupTestConfig()

	user := &User{
		Id:    "",
		Email: "test@example.com",
		Name:  "Test User",
	}

	// Should still generate token even with empty ID
	token, err := user.GenerateAccessToken("session-123")
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}
