package app

import (
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func GetNotes(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	notes := []models.Note{}
	if err := config.DB.NewSelect().
		Model(&notes).
		Where("userworkspace = ? AND owner = ?", id, user.Id).
		Scan(c.Context()); err != nil {
		log.Error("Error when getting notes: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Notes retrieved successfully",
		Data:    notes,
	})
}

func CreateNote(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	req := new(models.CreateNoteRequest)
	if err := c.Bind().Body(req); err != nil {
		log.Error("Error when binding request: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid request body",
			Data:   err.Error(),
		})
	}
	note := models.Note{
		Name:          req.Name,
		Icon:          req.Icon,
		Workspace:     req.Workspace,
		UserWorkspace: req.UserWorkspace,
		Owner:         user.Id,
		Favorite:      req.Favorite,
	}
	if _, err := config.DB.NewInsert().Model(&note).Exec(c.Context()); err != nil {
		log.Error("Error when creating note: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Error when creating note",
			Data:   err.Error(),
		})
	}
	return c.JSON(note)
}

func UpdateNote(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	req := new(models.UpdateNoteRequest)
	if err := c.Bind().Body(req); err != nil {
		log.Error("Error when binding request: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid request body",
			Data:   err.Error(),
		})
	}
	note := models.Note{
		Id:       id,
		Name:     req.Name,
		Icon:     req.Icon,
		Favorite: req.Favorite,
		IsPublic: req.IsPublic,
		Trashed:  req.Trashed,
	}
	log.Info("Updating note: ", note)
	if _, err := config.DB.NewUpdate().
		Model(&note).
		Column("name", "icon", "favorite", "is_public", "trashed").
		Where("id = ? AND owner = ?", id, user.Id).
		Returning("*").
		Exec(c.Context()); err != nil {
		log.Error("Error when updating note: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Error when updating note",
			Data:   err.Error(),
		})
	}
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note updated successfully",
		Data:    note,
	})
}
