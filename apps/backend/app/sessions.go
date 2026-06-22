package app

import (
	"fmt"

	"github.com/Tsuzat/Nota/db"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
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
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: fmt.Sprintf("Total %d sessions fetched", len(sessions)),
		Data:    sessions,
	})
}

func RevokeSession(c fiber.Ctx) error {
	id := c.Params("id")
	user := c.Locals("user").(*models.User)
	ok, err := db.RevokeSessionByOwner(id, user.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when revoking session",
			Data:   err.Error(),
		})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "You are not authorized to revoke this session or it doesn't exist",
		})
	}
	utils.DeleteCache("session:" + id)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Session revoked",
	})
}

func RevokeAllSessions(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	sessions, err := db.GetSessions(user.Id)
	if err == nil {
		for _, s := range sessions {
			utils.DeleteCache("session:" + s.Id)
		}
	}
	err = db.RevokeAllUserSessions(user.Id)
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
	ok, err := db.DeleteSessionByOwner(id, user.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting session",
			Data:   err.Error(),
		})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "You are not authorized to delete this session or it doesn't exist",
		})
	}
	utils.DeleteCache("session:" + id)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Session deleted",
	})
}

func DeleteAllSessions(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	sessions, err := db.GetSessions(user.Id)
	if err == nil {
		for _, s := range sessions {
			utils.DeleteCache("session:" + s.Id)
		}
	}
	err = db.DeleteAllUserSessions(user.Id)
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

func DeleteAllOtherSessions(c fiber.Ctx) error {
	keepId := c.Params("id")
	user := c.Locals("user").(*models.User)

	// Just verify the user owns the session they want to keep
	session, err := db.GetSession(keepId)
	if err != nil || session.UserId != user.Id {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "Invalid session",
		})
	}

	sessions, err := db.GetSessions(user.Id)
	if err == nil {
		for _, s := range sessions {
			if s.Id != keepId {
				utils.DeleteCache("session:" + s.Id)
			}
		}
	}

	err = db.DeleteAllOtherUserSessions(user.Id, keepId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting sessions",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "All other sessions deleted",
	})
}
