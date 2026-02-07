package test

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/testutils"
	"github.com/Tsuzat/Nota/utils"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGeneratePresignedURL_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockProUser() // Pro user with storage

	fiberApp.Post("/storage/presign", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GeneratePresignedURL(c)
	})

	req := httptest.NewRequest("POST", "/storage/presign", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestGeneratePresignedURL_InvalidContentType(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockProUser()

	fiberApp.Post("/storage/presign", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GeneratePresignedURL(c)
	})

	body := `{"filename": "test.exe", "contentType": "application/x-executable", "size": 1000}`
	req := httptest.NewRequest("POST", "/storage/presign", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(respBody), "Invalid or disallowed content type")
}

func TestGeneratePresignedURL_FileSizeExceeded(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockProUser()

	fiberApp.Post("/storage/presign", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GeneratePresignedURL(c)
	})

	// 100MB file, exceeds 50MB limit
	body := `{"filename": "large.pdf", "contentType": "application/pdf", "size": 104857600}`
	req := httptest.NewRequest("POST", "/storage/presign", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(respBody), "File size exceeds")
}

func TestGeneratePresignedURL_StorageQuotaExceeded(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser() // Free user with 0 storage

	fiberApp.Post("/storage/presign", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.GeneratePresignedURL(c)
	})

	body := `{"filename": "test.pdf", "contentType": "application/pdf", "size": 1000}`
	req := httptest.NewRequest("POST", "/storage/presign", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)

	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(respBody), "Storage quota exceeded")
}

func TestConfirmUpload_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockProUser()

	fiberApp.Post("/storage/confirm", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.ConfirmUpload(c)
	})

	req := httptest.NewRequest("POST", "/storage/confirm", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestConfirmUpload_InvalidKeyOwnership(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Post("/storage/confirm", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.ConfirmUpload(c)
	})

	// Key doesn't belong to user (different user ID prefix)
	body := `{"key": "other-user-id/images/test.png"}`
	req := httptest.NewRequest("POST", "/storage/confirm", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)

	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(respBody), "Invalid key ownership")
}

func TestDeleteFile_InvalidBody(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockProUser()

	fiberApp.Delete("/storage/file", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.DeleteFile(c)
	})

	req := httptest.NewRequest("DELETE", "/storage/file", strings.NewReader("invalid"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestDeleteFile_PermissionDenied(t *testing.T) {
	fiberApp := testutils.CreateTestApp()
	mockUser := testutils.MockUser()

	fiberApp.Delete("/storage/file", func(c fiber.Ctx) error {
		c.Locals("user", mockUser)
		return app.DeleteFile(c)
	})

	// Key doesn't belong to user
	body := `{"key": "another-user/images/test.png"}`
	req := httptest.NewRequest("DELETE", "/storage/file", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := fiberApp.Test(req)

	require.NoError(t, err)
	assert.Equal(t, fiber.StatusForbidden, resp.StatusCode)

	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Contains(t, string(respBody), "Permission denied")
}

// Test utils.GetFolder function
func TestGetFolder(t *testing.T) {
	tests := []struct {
		name     string
		mime     string
		expected string
	}{
		{"JPEG image", "image/jpeg", "images"},
		{"PNG image", "image/png", "images"},
		{"WebP image", "image/webp", "images"},
		{"MP4 video", "video/mp4", "videos"},
		{"WebM video", "video/webm", "videos"},
		{"MP3 audio", "audio/mpeg", "audios"},
		{"WAV audio", "audio/wav", "audios"},
		{"PDF document", "application/pdf", "docs"},
		{"Plain text", "text/plain", "docs"},
		{"Markdown", "text/markdown", "docs"},
		{"Word document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docs"},
		{"Unknown type", "application/octet-stream", "others"},
		{"Empty mime", "", "others"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := utils.GetFolder(tt.mime)
			assert.Equal(t, tt.expected, result)
		})
	}
}
