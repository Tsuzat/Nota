package app

import (
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func Me(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	session, _ := c.Locals("session").(*models.Session)

	var sessionData any = nil
	if session != nil && session.Id != "" {
		sessionData = session
	}

	return c.Status(200).JSON(models.APIResponse{
		Status:  200,
		Message: "Success",
		Data: fiber.Map{
			"user":    user.UserResponse(),
			"session": sessionData,
		},
	})
}
