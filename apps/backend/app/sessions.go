package app

import (
	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
)

func GetUserSessions(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	sessions, err := db.GetSessions(user.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when fetching sessions",
			Data:   err.Error(),
		})
	}
	return c.JSON(sessions)
}

func RevokeSession(c fiber.Ctx) error {
	id := c.Params("id")
	user := c.Locals("user").(*models.User)
	if !db.CheckSessionOwner(id, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "You are not authorized to revoke this session",
		})
	}
	err := db.RevokeSession(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when revoking session",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Session revoked",
	})
}

func RevokeAllSessions(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	err := db.RevokeAllUserSessions(user.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when revoking all sessions",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "All sessions revoked",
	})
}

func DeleteSession(c fiber.Ctx) error {
	id := c.Params("id")
	user := c.Locals("user").(*models.User)
	if !db.CheckSessionOwner(id, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "You are not authorized to delete this session",
		})
	}
	err := db.DeleteSession(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting session",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Session deleted",
	})
}

func DeleteAllSessions(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	err := db.DeleteAllUserSessions(user.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting all sessions",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "All sessions deleted",
	})
}
