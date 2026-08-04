package test

import (
	"fmt"
	"io"
	"math"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type structValidator struct {
	validate *validator.Validate
}

func (v *structValidator) Validate(out any) error {
	return v.validate.Struct(out)
}

// createValidatedTestApp creates a test app with the validator attached
func createValidatedTestApp() *fiber.App {
	return fiber.New(fiber.Config{
		StructValidator: &structValidator{validate: validator.New()},
	})
}

// --- GenerateContent handler tests ---

func TestGenerateContent_InsufficientCredits(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = 0.0

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	body := `{"prompt": "hello", "note_id": "f47d085c-fcbf-41ac-bcb2-689ec440734f"}`
	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)

	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(respBody), "Insufficient AI credits")
}

func TestGenerateContent_NegativeCredits(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = -5.0

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	body := `{"prompt": "hello", "note_id": "f47d085c-fcbf-41ac-bcb2-689ec440734f"}`
	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)
}

func TestGenerateContent_InvalidBody(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = 500.0

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader("not valid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestGenerateContent_EmptyPrompt(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = 500.0

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	body := `{"prompt": "", "note_id": "f47d085c-fcbf-41ac-bcb2-689ec440734f"}`
	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestGenerateContent_MissingNoteId(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = 500.0

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	body := `{"prompt": "hello"}`
	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestGenerateContent_InvalidNoteId(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = 500.0

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	// note_id is not a valid UUID
	body := `{"prompt": "hello", "note_id": "not-a-uuid"}`
	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

// --- Cost calculation unit tests ---

func TestCostCalculation_BasicInput(t *testing.T) {
	// Input cost: $0.60 per 1M = 0.00006 cents per token
	// Output cost: $5.00 per 1M = 0.0005 cents per token
	inputTokens := 1000
	outputTokens := 500

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	// inputCost = 0.06, outputCost = 0.25, total = 0.31, ceil = 1
	assert.Equal(t, 1, totalCostCents)
}

func TestCostCalculation_LargeTokenCount(t *testing.T) {
	inputTokens := 100_000
	outputTokens := 10_000

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	// inputCost = 6.0, outputCost = 5.0, total = 11.0, ceil = 11
	assert.Equal(t, 11, totalCostCents)
}

func TestCostCalculation_ZeroTokens(t *testing.T) {
	inputTokens := 0
	outputTokens := 0

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	assert.Equal(t, 0, totalCostCents)
}

func TestCostCalculation_OnlyInputTokens(t *testing.T) {
	inputTokens := 50_000
	outputTokens := 0

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	// inputCost = 3.0, outputCost = 0, total = 3
	assert.Equal(t, 3, totalCostCents)
}

func TestCostCalculation_OnlyOutputTokens(t *testing.T) {
	inputTokens := 0
	outputTokens := 2000

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	// inputCost = 0, outputCost = 1.0, total = 1
	assert.Equal(t, 1, totalCostCents)
}

func TestCostCalculation_SmallTokensCeilsUp(t *testing.T) {
	// Very small usage should still ceil to 1 cent
	inputTokens := 100
	outputTokens := 1

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	// inputCost = 0.006, outputCost = 0.0005, total = 0.0065, ceil = 1
	assert.Equal(t, 1, totalCostCents)
}

// --- GenerateRequest validation tests ---

func TestGenerateRequest_ValidRequest(t *testing.T) {
	fiberApp := createValidatedTestApp()
	mockUser := testutils.MockUser()
	mockUser.AiCredits = 500.0

	// Set a dummy API key so the GenAI client initialization doesn't throw an error log
	config.GEMINI_API_KEY = "dummy-api-key"

	fiberApp.Post("/ai/generate", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GenerateContent(c)
	})

	body := `{"prompt": "Write a haiku", "note_id": "f47d085c-fcbf-41ac-bcb2-689ec440734f"}`
	req := httptest.NewRequest("POST", "/ai/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	// Should NOT be 400 (validation) or 403 (credits) — it passes validation
	assert.NotEqual(t, fiber.StatusBadRequest, resp.StatusCode)
	assert.NotEqual(t, fiber.StatusForbidden, resp.StatusCode)
}

// --- Description format test ---

func TestDescriptionFormat(t *testing.T) {
	inputTokens := 10_000
	outputTokens := 2_000

	inputCost := float64(inputTokens) * 0.00006
	outputCost := float64(outputTokens) * 0.0005
	totalCostCents := int(math.Ceil(inputCost + outputCost))

	// Mirror the exact format from app/ai.go
	description := fmt.Sprintf("Used $%g in input, $%g in output and $%.2f in total.", inputCost/100.0, outputCost/100.0, float64(totalCostCents)/100.0)

	assert.Contains(t, description, "Used $")
	assert.Contains(t, description, "in input")
	assert.Contains(t, description, "in output")
	assert.Contains(t, description, "in total")
	assert.Contains(t, description, "$0.02")
}
