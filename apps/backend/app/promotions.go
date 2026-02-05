package app

import (
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func RedeemAICredits(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	user.AiCredits += 10000
	if err := db.UpdateUser(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when adding AI credits",
			Data:   err.Error(),
		})
	}
	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Added AI credits successfully",
		Data:    user.AiCredits,
	})
}
