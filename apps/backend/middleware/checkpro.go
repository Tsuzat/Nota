package middleware

import (
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func CheckPro(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	isPro := user.SubscriptionPlan == "pro"
	if !isPro {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "This feature requires pro plan",
		})
	}
	return c.Next()
}
