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

func TestCreateNote_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Post("/notes", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.CreateNote(c)
	})

	req := httptest.NewRequest("POST", "/notes", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid request body")
}

func TestUpdateNote_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Put("/notes/:id", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.UpdateNote(c)
	})

	req := httptest.NewRequest("PUT", "/notes/test-note-id", strings.NewReader("not valid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid request body")
}

func TestApplyNoteContentPatch_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Patch("/notes/:id/content", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.ApplyNoteContentPatch(c)
	})

	req := httptest.NewRequest("PATCH", "/notes/test-id/content", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestApplyNoteContentPatch_EmptyOperations(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Patch("/notes/:id/content", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.ApplyNoteContentPatch(c)
	})

	// Empty operations array
	req := httptest.NewRequest("PATCH", "/notes/test-id/content", strings.NewReader(`{"operations": []}`))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	// Should return bad request for empty operations
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}
