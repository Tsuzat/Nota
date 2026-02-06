package app

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func GetUserWorkspaces(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userworkspaces := []models.UserWorkspace{}
	err := config.DB.NewSelect().Model(&userworkspaces).Where("owner = ?", user.Id).Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when fetching the userworkspaces",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User Workspaces Fetched",
		Data:    userworkspaces,
	})
}

func CreateUserWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	req := new(models.CreateUserWorkspaceRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).
			JSON(models.APIError{
				Status: fiber.StatusBadRequest,
				Error:  "Invalid request body",
				Data:   err.Error(),
			})
	}
	userworkspace := &models.UserWorkspace{
		Icon:  req.Icon,
		Name:  req.Name,
		Owner: user.Id,
	}
	_, err := config.DB.NewInsert().Model(userworkspace).Exec(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when creating the userworkspace",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User Workspace Created",
		Data:    userworkspace,
	})
}

func UpdateUserWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	req := new(models.CreateUserWorkspaceRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).
			JSON(models.APIError{
				Status: fiber.StatusBadRequest,
				Error:  "Invalid request body",
				Data:   err.Error(),
			})
	}
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid userworkspace id",
			Data:   "id is required",
		})
	}
	userworkspace := &models.UserWorkspace{
		Id:        id,
		Icon:      req.Icon,
		Name:      req.Name,
		Owner:     user.Id,
		UpdatedAt: time.Now(),
	}
	_, err := config.DB.NewUpdate().Model(userworkspace).Where("id = ? and owner = ?", id, user.Id).Exec(c.Context())
	if err != nil {
		log.Error("Error while updating userworkspace: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when updating the userworkspace",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User Workspace Updated",
		Data:    userworkspace,
	})
}

func DeleteUserWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	_, err := config.DB.NewDelete().Model(&models.UserWorkspace{}).Where("id = ? and owner = ?", id, user.Id).Exec(c.Context())
	if err != nil {
		log.Error("Error while deleting userworkspace: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting the userworkspace",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User Workspace Deleted",
	})
}
