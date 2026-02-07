package test

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateUserWorkspace_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Post("/userworkspaces", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.CreateUserWorkspace(c)
	})

	req := httptest.NewRequest("POST", "/userworkspaces", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid request body")
}

func TestUpdateUserWorkspace_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Put("/userworkspaces/:id", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.UpdateUserWorkspace(c)
	})

	req := httptest.NewRequest("PUT", "/userworkspaces/test-id", strings.NewReader("not valid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid request body")
}

func TestUpdateUserWorkspace_MissingId(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Put("/userworkspaces/:id", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.UpdateUserWorkspace(c)
	})

	// Valid JSON body for update
	body := `{"name": "Test Workspace", "icon": "📝"}`
	req := httptest.NewRequest("PUT", "/userworkspaces/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	// Should return 404 because empty ID doesn't match route
	assert.Equal(t, 404, resp.StatusCode)
}
