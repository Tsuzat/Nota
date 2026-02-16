package app

import (
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func Me(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	return c.Status(200).JSON(models.APIResponse{
		Status:  200,
		Message: "Success",
		Data:    user.UserResponse(),
	})
}
