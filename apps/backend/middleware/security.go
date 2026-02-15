package middleware

import (
	"regexp"

	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

var suspiciousPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)<script>`),
	regexp.MustCompile(`(?i)javascript:`),
	regexp.MustCompile(`(?i)vbscript:`),
	regexp.MustCompile(`(?i)data:`),
	regexp.MustCompile(`(?i)onload=`),
	regexp.MustCompile(`(?i)onerror=`),
	regexp.MustCompile(`(?i)onclick=`),
	regexp.MustCompile("\x00"),
}

func isSuspicious(input string) bool {
	for _, pattern := range suspiciousPatterns {
		if pattern.MatchString(input) {
			return true
		}
	}
	return false
}

func SanitizationMiddleware(c fiber.Ctx) error {
	queries := c.Queries()
	for key, value := range queries {
		if isSuspicious(value) {
			return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
				Status: fiber.StatusBadRequest,
				Error:  "Malicious input detected in query parameter: " + key,
			})
		}
	}
	return c.Next()
}
