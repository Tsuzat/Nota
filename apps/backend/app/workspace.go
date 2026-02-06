package app

import (
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func GetWorkspaces(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var workspaces []models.Workspace
	err := config.DB.NewSelect().Model(&workspaces).Where("owner = ?", user.Id).Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when fetching the workspaces",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspaces Fetched",
		Data:    workspaces,
	})
}

func CreateWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	req := new(models.CreateWorkspaceRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).
			JSON(models.APIError{
				Status: fiber.StatusBadRequest,
				Error:  "Invalid request body",
				Data:   err.Error(),
			})
	}
	workspace := &models.Workspace{
		Icon:          req.Icon,
		Name:          req.Name,
		Description:   req.Description,
		Owner:         user.Id,
		UserWorkspace: req.UserWorkspace,
	}
	_, err := config.DB.NewInsert().Model(workspace).Exec(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when creating the userworkspace",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspace Created",
		Data:    workspace,
	})
}

func UpdateWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	req := new(models.CreateWorkspaceRequest)
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
	workspace := &models.Workspace{
		Id:          id,
		Icon:        req.Icon,
		Name:        req.Name,
		Description: req.Description,
		Owner:       user.Id,
		UpdatedAt:   time.Now(),
	}
	_, err := config.DB.NewUpdate().Model(workspace).Where("id = ? and owner = ?", id, user.Id).Exec(c.Context())
	if err != nil {
		log.Error("Error while updating workspace: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when updating the workspace",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspace Updated",
		Data:    workspace,
	})
}

func DeleteWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	_, err := config.DB.NewDelete().Model(&models.Workspace{}).Where("id = ? and owner = ?", id, user.Id).Exec(c.Context())
	if err != nil {
		log.Error("Error while deleting workspace: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting the workspace",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspace Deleted",
	})
}
