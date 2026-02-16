package test

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	ap "github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateWorkspace_InvalidBody(t *testing.T) {
	app := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	app.Post("/workspace", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return ap.CreateWorkspace(c)
	})

	// Send invalid JSON body
	req := httptest.NewRequest("POST", "/workspace", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid request body")
}

func TestUpdateWorkspace_MissingId(t *testing.T) {
	app := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	// Route without :id param to simulate missing ID
	app.Put("/workspace/:id", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return ap.UpdateWorkspace(c)
	})

	// Valid JSON but empty ID in route
	body := `{"name": "Test Workspace", "icon": "📝", "description": "Test"}`
	req := httptest.NewRequest("PUT", "/workspace/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	require.NoError(t, err)
	// Should return 404 because empty ID doesn't match route
	assert.Equal(t, 404, resp.StatusCode)
}

func TestUpdateWorkspace_InvalidBody(t *testing.T) {
	app := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	app.Put("/workspace/:id", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return ap.UpdateWorkspace(c)
	})

	req := httptest.NewRequest("PUT", "/workspace/some-id", strings.NewReader("not valid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid request body")
}
