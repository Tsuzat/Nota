package testutils

import (
	"time"

	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

// CreateTestApp creates a new Fiber app for testing
func CreateTestApp() *fiber.App {
	return fiber.New()
}

// MockUser returns a mock user for testing authenticated routes
func MockUser() *models.User {
	return &models.User{
		Id:               "test-user-id-123",
		Email:            "test@example.com",
		Name:             "Test User",
		AvatarUrl:        "https://example.com/avatar.png",
		Provider:         "email",
		ProviderId:       "",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		IsVerified:       true,
		SubscriptionPlan: "free",
		AiCredits:        1000,
		AssignedStorage:  0,
		UsedStorage:      0,
		EmailVerified:    true,
	}
}

// MockProUser returns a mock pro user for testing subscription features
func MockProUser() *models.User {
	user := MockUser()
	user.SubscriptionPlan = "pro"
	user.SubscriptionType = "monthly"
	user.AiCredits = 2_000_000
	user.AssignedStorage = 1_000_000_000
	return user
}
