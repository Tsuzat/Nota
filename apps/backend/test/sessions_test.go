package test

import (
	"net/http/httptest"
	"testing"

	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRevokeSession_MissingId(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Post("/sessions/:id/revoke", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.RevokeSession(c)
	})

	// Empty ID should not match route
	req := httptest.NewRequest("POST", "/sessions//revoke", nil)
	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, 404, resp.StatusCode)
}

func TestDeleteSession_MissingId(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Delete("/sessions/:id", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.DeleteSession(c)
	})

	// Empty ID should not match route
	req := httptest.NewRequest("DELETE", "/sessions/", nil)
	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, 404, resp.StatusCode)
}
