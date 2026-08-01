package middleware

import (
	"strings"

	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

const StandardMaxPayloadSize = 4 * 1024 * 1024 // 4 MB standard limit

func isLargePayloadRoute(path string) bool {
	return strings.HasSuffix(path, "/restore-from-content") ||
		strings.HasSuffix(path, "/restore") ||
		strings.HasSuffix(path, "/import") ||
		strings.Contains(path, "/versions") ||
		strings.Contains(path, "/storage/") ||
		strings.Contains(path, "/assets/")
}

// PayloadLimitMiddleware enforces standard 4MB limits on typical endpoints
// while allowing up to 20MB (engine BodyLimit) for high-capacity import/restore/storage endpoints.
func PayloadLimitMiddleware(c fiber.Ctx) error {
	if c.Request().Header.ContentLength() > StandardMaxPayloadSize {
		if !isLargePayloadRoute(c.Path()) {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(models.APIError{
				Status: fiber.StatusRequestEntityTooLarge,
				Error:  "Payload too large for this endpoint",
			})
		}
	}
	return c.Next()
}
