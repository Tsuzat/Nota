package app

import (
	"fmt"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func GetWorkspaces(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	workspaces := []models.Workspace{}

	cacheKey := fmt.Sprintf("workspaces:%s", user.Id)
	if utils.GetCache(cacheKey, &workspaces) == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Workspaces Fetched",
			Data:    workspaces,
		})
	}

	err := config.DB.NewSelect().
		Model(&workspaces).
		Where("owner = ?", user.Id).
		Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when fetching the workspaces",
			Data:   err.Error(),
		})
	}

	// setting the cache for 7 days, it's invalidates on workspace update anyways
	go utils.SetCache(cacheKey, workspaces, time.Hour*24*7)

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
		Icon:        req.Icon,
		Name:        req.Name,
		Description: req.Description,
		Owner:       user.Id,
	}
	_, err := config.DB.NewInsert().Model(workspace).Exec(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when creating the workspace",
			Data:   err.Error(),
		})
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("workspaces:%s", user.Id)
	go utils.DeleteCache(cacheKey)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspace Created",
		Data:    workspace,
	})
}

func UpdateWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	req := new(models.UpdateWorkspaceRequest)
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
			Error:  "Invalid workspace id",
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
	_, err := config.DB.NewUpdate().
		Model(workspace).
		Column("icon", "name", "description", "updated_at").
		Where("id = ? and owner = ?", id, user.Id).
		Returning("*").
		Exec(c.Context())
	if err != nil {
		log.Error("Error while updating workspace: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when updating the workspace",
			Data:   err.Error(),
		})
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("workspaces:%s", user.Id)
	go utils.DeleteCache(cacheKey)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspace Updated",
		Data:    workspace,
	})
}

func DeleteWorkspace(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	_, err := config.DB.NewDelete().
		Model(&models.Workspace{}).
		Where("id = ? and owner = ?", id, user.Id).
		Exec(c.Context())
	if err != nil {
		log.Error("Error while deleting workspace: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when deleting the workspace",
			Data:   err.Error(),
		})
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("workspaces:%s", user.Id)
	go utils.DeleteCache(cacheKey)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Workspace Deleted",
	})
}
