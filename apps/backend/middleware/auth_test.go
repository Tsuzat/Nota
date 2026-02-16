package middleware

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Tsuzat/Nota/config"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupAuthTestConfig() {
	config.ACCESS_TOKEN_SECRET = "test-access-secret-key-12345"
	config.ACCESS_TOKEN_EXPIRY = 15
}

func TestAuthenticate_NoToken(t *testing.T) {
	setupAuthTestConfig()

	app := fiber.New()
	app.Get("/protected", Authenticate, func(c fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "User is not authenticated")
}

func TestAuthenticate_NoCookie_NoHeader(t *testing.T) {
	setupAuthTestConfig()

	app := fiber.New()
	app.Get("/protected", Authenticate, func(c fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	// Explicitly no cookies or authorization header
	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
}

func TestAuthenticate_InvalidToken(t *testing.T) {
	setupAuthTestConfig()

	app := fiber.New()
	app.Get("/protected", Authenticate, func(c fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.AddCookie(&http.Cookie{
		Name:  "access_token",
		Value: "invalid.token.here",
	})

	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
}

func TestAuthenticate_MalformedToken(t *testing.T) {
	setupAuthTestConfig()

	app := fiber.New()
	app.Get("/protected", Authenticate, func(c fiber.Ctx) error {
		return c.SendString("OK")
	})

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer totally-not-a-valid-jwt")

	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
}
