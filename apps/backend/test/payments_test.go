package test

import (
	"testing"

	"github.com/Tsuzat/Nota/config"
	"github.com/stretchr/testify/assert"
)

func getCreditsToAdd(productId string) int {
	switch productId {
	case config.POLAR_MONTLY_SUB:
		return 2_000_000
	case config.POLAR_YEARLY_SUB:
		return 25_000_000
	case config.POLAR_AI_CREDITS:
		return 5_000_000
	default:
		return 0
	}
}

func getStorageToAdd(productId string) int64 {
	switch productId {
	case config.POLAR_MONTLY_SUB:
		return 1_000_000_000
	case config.POLAR_YEARLY_SUB:
		return 1_500_000_000
	default:
		return 0
	}
}

func getSubscriptionTier(productId string) string {
	if productId == config.POLAR_MONTLY_SUB || productId == config.POLAR_YEARLY_SUB {
		return "pro"
	}
	return "free"
}

func getSubscriptionTime(productId string) string {
	if productId == config.POLAR_YEARLY_SUB {
		return "yearly"
	}
	return "monthly"
}

func TestGetCreditsToAdd(t *testing.T) {
	// Setup: Initialize config values for tests
	config.POLAR_MONTLY_SUB = "monthly-sub-id"
	config.POLAR_YEARLY_SUB = "yearly-sub-id"
	config.POLAR_AI_CREDITS = "ai-credits-id"

	tests := []struct {
		name      string
		productId string
		expected  int
	}{
		{
			name:      "Monthly subscription should return 2 million credits",
			productId: config.POLAR_MONTLY_SUB,
			expected:  2_000_000,
		},
		{
			name:      "Yearly subscription should return 25 million credits",
			productId: config.POLAR_YEARLY_SUB,
			expected:  25_000_000,
		},
		{
			name:      "AI credits product should return 5 million credits",
			productId: config.POLAR_AI_CREDITS,
			expected:  5_000_000,
		},
		{
			name:      "Unknown product should return 0 credits",
			productId: "unknown-product-id",
			expected:  0,
		},
		{
			name:      "Empty product ID should return 0 credits",
			productId: "",
			expected:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getCreditsToAdd(tt.productId)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetStorageToAdd(t *testing.T) {
	// Setup: Initialize config values for tests
	config.POLAR_MONTLY_SUB = "monthly-sub-id"
	config.POLAR_YEARLY_SUB = "yearly-sub-id"

	tests := []struct {
		name      string
		productId string
		expected  int64
	}{
		{
			name:      "Monthly subscription should return 1GB storage",
			productId: config.POLAR_MONTLY_SUB,
			expected:  1_000_000_000,
		},
		{
			name:      "Yearly subscription should return 1.5GB storage",
			productId: config.POLAR_YEARLY_SUB,
			expected:  1_500_000_000,
		},
		{
			name:      "Unknown product should return 0 storage",
			productId: "unknown-product-id",
			expected:  0,
		},
		{
			name:      "AI credits product should return 0 storage",
			productId: config.POLAR_AI_CREDITS,
			expected:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getStorageToAdd(tt.productId)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetSubscriptionTier(t *testing.T) {
	// Setup: Initialize config values for tests
	config.POLAR_MONTLY_SUB = "monthly-sub-id"
	config.POLAR_YEARLY_SUB = "yearly-sub-id"

	tests := []struct {
		name      string
		productId string
		expected  string
	}{
		{
			name:      "Monthly subscription should return pro tier",
			productId: config.POLAR_MONTLY_SUB,
			expected:  "pro",
		},
		{
			name:      "Yearly subscription should return pro tier",
			productId: config.POLAR_YEARLY_SUB,
			expected:  "pro",
		},
		{
			name:      "Unknown product should return free tier",
			productId: "unknown-product-id",
			expected:  "free",
		},
		{
			name:      "Empty product ID should return free tier",
			productId: "",
			expected:  "free",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getSubscriptionTier(tt.productId)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetSubscriptionTime(t *testing.T) {
	// Setup: Initialize config values for tests
	config.POLAR_MONTLY_SUB = "monthly-sub-id"
	config.POLAR_YEARLY_SUB = "yearly-sub-id"

	tests := []struct {
		name      string
		productId string
		expected  string
	}{
		{
			name:      "Yearly subscription should return yearly",
			productId: config.POLAR_YEARLY_SUB,
			expected:  "yearly",
		},
		{
			name:      "Monthly subscription should return monthly",
			productId: config.POLAR_MONTLY_SUB,
			expected:  "monthly",
		},
		{
			name:      "Unknown product should return monthly",
			productId: "unknown-product-id",
			expected:  "monthly",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getSubscriptionTime(tt.productId)
			assert.Equal(t, tt.expected, result)
		})
	}
}
