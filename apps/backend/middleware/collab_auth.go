package middleware

import (
	"crypto/subtle"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

// CollabAuth is a Fiber middleware that gates internal service-to-service
// calls using the INTERNAL_API_KEY. The collaboration server must send
// the key in the "X-Internal-Api-Key" header.
func CollabAuth(c fiber.Ctx) error {
	apiKey := string(c.Request().Header.Peek("X-Internal-Api-Key"))

	if apiKey == "" || subtle.ConstantTimeCompare([]byte(apiKey), []byte(config.INTERNAL_API_KEY)) != 1 {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "Invalid or missing internal API key",
		})
	}

	return c.Next()
}
