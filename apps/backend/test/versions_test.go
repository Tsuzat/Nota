package test

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestStoreYDoc_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	config.INTERNAL_API_KEY = "test-key"

	fiberApp.Put("/collab/notes/:noteId/ydoc", func(c fiber.Ctx) error {
		return app.StoreYDoc(c)
	})

	req := httptest.NewRequest("PUT", "/collab/notes/test-note-id/ydoc", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Api-Key", "test-key")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Invalid payload")
}

func TestStoreYDoc_EmptyYDocState(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	config.INTERNAL_API_KEY = "test-key"

	fiberApp.Put("/collab/notes/:noteId/ydoc", func(c fiber.Ctx) error {
		return app.StoreYDoc(c)
	})

	req := httptest.NewRequest("PUT", "/collab/notes/test-note-id/ydoc", strings.NewReader(`{"ydoc_state": "", "content": {}}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Api-Key", "test-key")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(body), "Empty ydoc state")
}
