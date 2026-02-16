package test

import (
	"io"
	"net/http/httptest"
	"testing"

	ap "github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMe_ReturnsUserResponse(t *testing.T) {
	app := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	// Setup route with mock user in context
	app.Get("/me", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return ap.Me(c)
	})

	req := httptest.NewRequest("GET", "/me", nil)
	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	// Verify response contains expected user data
	bodyStr := string(body)
	assert.Contains(t, bodyStr, mockUser.Id)
	assert.Contains(t, bodyStr, mockUser.Email)
	assert.Contains(t, bodyStr, mockUser.Name)
	assert.Contains(t, bodyStr, `"status":200`)
	assert.Contains(t, bodyStr, `"message":"Success"`)
}

func TestMe_ProUserResponse(t *testing.T) {
	app := testutils.CreateTestApp()
	mockUser := testutils.MockProUser()

	app.Get("/me", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return ap.Me(c)
	})

	req := httptest.NewRequest("GET", "/me", nil)
	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	bodyStr := string(body)
	assert.Contains(t, bodyStr, `"subscription_plan":"pro"`)
}
