package app

import (
	"fmt"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/uptrace/bun"
)

func GetUserWorkspaceData(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")

	userworkspaces := new(models.UserWorkspace)

	cacheKey := fmt.Sprintf("userworkspacedata:%s", id)
	if utils.GetCache(cacheKey, userworkspaces) == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "User Workspace Data Fetched",
			Data:    userworkspaces,
		})
	}
	// get all the workspaces and notes for given userworkspace id
	err := config.DB.NewSelect().
		Model(userworkspaces).
		Where("id = ? AND owner = ?", id, user.Id).
		Relation("Workspaces", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.Where("userworkspace = ?", id).Order("created_at DESC")
		}).
		Relation("Notes", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.
				Column(
					"id",
					"name",
					"icon",
					"workspace",
					"userworkspace",
					"owner",
					"favorite",
					"trashed",
					"created_at",
					"updated_at",
					"is_public",
				).
				Where("userworkspace = ?", id).
				Order("created_at DESC")
		}).
		Scan(c.Context())
	if err != nil {
		log.Error("Error fetching userworkspace data: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when fetching the userworkspace data",
			Data:   err.Error(),
		})
	}
	// set the cache for 7 days, if user does not change the userworkspaces, we can use the cache
	go utils.SetCache(cacheKey, userworkspaces, time.Hour*24*7)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User Workspace Data Fetched",
		Data:    userworkspaces,
	})
}

func GetUserWorkspaces(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userworkspaces := []models.UserWorkspace{}

	cacheKey := fmt.Sprintf("userworkspaces:%s", user.Id)
	if utils.GetCache(cacheKey, &userworkspaces) == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "User Workspaces Fetched",
			Data:    userworkspaces,
		})
	}

	err := config.DB.NewSelect().Model(&userworkspaces).Where("owner = ?", user.Id).Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Something went wrong when fetching the userworkspaces",
			Data:   err.Error(),
		})
	}

	// set the cache for 7 days, if user does not change the userworkspaces, we can use the cache
	go utils.SetCache(cacheKey, userworkspaces, time.Hour*24*7)

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

	// Invalidate cache
	cacheKey := fmt.Sprintf("userworkspaces:%s", user.Id)
	go utils.DeleteCache(cacheKey)

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

	// Invalidate cache
	cacheKey := fmt.Sprintf("userworkspaces:%s", user.Id)
	go utils.DeleteCache(cacheKey)

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

	// Invalidate cache
	cacheKey := fmt.Sprintf("userworkspaces:%s", user.Id)
	go utils.DeleteCache(cacheKey)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "User Workspace Deleted",
	})
}
