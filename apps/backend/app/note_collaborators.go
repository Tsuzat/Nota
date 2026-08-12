package app

import (
	"context"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

type AddCollaboratorRequest struct {
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required,oneof=editor viewer admin"`
}

type UpdateCollaboratorRequest struct {
	Role string `json:"role" validate:"required,oneof=editor viewer admin"`
}

// Helper to check if user is note owner or admin collaborator
func checkNoteAdmin(ctx context.Context, noteId, userId string) (bool, error) {
	var note models.Note
	err := config.DB.NewSelect().Model(&note).Column("owner").Where("id = ?", noteId).Scan(ctx)
	if err != nil {
		return false, err
	}
	if note.Owner == userId {
		return true, nil
	}

	var collab models.NoteCollaborator
	err = config.DB.NewSelect().Model(&collab).Column("role").Where("note_id = ? AND user_id = ?", noteId, userId).Scan(ctx)
	if err != nil {
		return false, nil // Note found but not a collaborator or DB error
	}
	if collab.Role == "admin" {
		return true, nil
	}

	return false, nil
}

// GetCollaborators fetches all collaborators for a specific note
func GetCollaborators(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")

	// Verify user has access (owner or any collab)
	var note models.Note
	err := config.DB.NewSelect().Model(&note).Column("owner").Where("id = ?", noteId).Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "Note not found"})
	}

	if note.Owner != user.Id {
		exists, _ := config.DB.NewSelect().Model((*models.NoteCollaborator)(nil)).
			Where("note_id = ? AND user_id = ?", noteId, user.Id).Exists(c.Context())
		if !exists {
			return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Not authorized"})
		}
	}

	var collabs []models.CollaboratorResponse
	err = config.DB.NewSelect().
		Model((*models.NoteCollaborator)(nil)).
		ColumnExpr("note_collaborator.*").
		ColumnExpr("u.email").
		ColumnExpr("u.name").
		ColumnExpr("u.avatar_url").
		Join("JOIN users AS u ON u.id = note_collaborator.user_id").
		Where("note_collaborator.note_id = ?", noteId).
		Scan(c.Context(), &collabs)

	if err != nil {
		log.Error("GetCollaborators - scan failed: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to fetch collaborators",
		})
	}

	if collabs == nil {
		collabs = make([]models.CollaboratorResponse, 0)
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Collaborators retrieved successfully",
		Data:    collabs,
	})
}

// AddCollaborator invites a user by email to collaborate on a note
func AddCollaborator(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")

	isAdmin, err := checkNoteAdmin(c.Context(), noteId, user.Id)
	if err != nil || !isAdmin {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Must be note owner or admin to add collaborators"})
	}

	req := new(AddCollaboratorRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "Invalid request"})
	}

	// Find the user to add by email
	var targetUser models.User
	err = config.DB.NewSelect().Model(&targetUser).Where("email = ?", req.Email).Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "User not found"})
	}

	if targetUser.Id == user.Id {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "Cannot add yourself as a collaborator"})
	}

	collab := models.NoteCollaborator{
		NoteId: noteId,
		UserId: targetUser.Id,
		Role:   req.Role,
	}

	_, err = config.DB.NewInsert().Model(&collab).Exec(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to add collaborator"})
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusCreated,
		Message: "Collaborator added successfully",
		Data:    collab,
	})
}

// UpdateCollaboratorRole updates a collaborator's role
func UpdateCollaboratorRole(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")
	collabId := c.Params("collabId")

	isAdmin, err := checkNoteAdmin(c.Context(), noteId, user.Id)
	if err != nil || !isAdmin {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Must be note owner or admin to update roles"})
	}

	req := new(UpdateCollaboratorRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "Invalid request"})
	}

	_, err = config.DB.NewUpdate().
		Model((*models.NoteCollaborator)(nil)).
		Set("role = ?", req.Role).
		Where("id = ? AND note_id = ?", collabId, noteId).
		Exec(c.Context())

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to update role"})
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Collaborator role updated",
	})
}

// RemoveCollaborator removes a collaborator from the note
func RemoveCollaborator(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")
	collabId := c.Params("collabId")

	// Allow admins to remove others, OR allow users to remove themselves
	var collab models.NoteCollaborator
	err := config.DB.NewSelect().Model(&collab).Where("id = ? AND note_id = ?", collabId, noteId).Scan(c.Context())
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "Collaborator not found"})
	}

	isAdmin, _ := checkNoteAdmin(c.Context(), noteId, user.Id)
	if !isAdmin && collab.UserId != user.Id {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Not authorized to remove this collaborator"})
	}

	_, err = config.DB.NewDelete().
		Model((*models.NoteCollaborator)(nil)).
		Where("id = ?", collabId).
		Exec(c.Context())

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to remove collaborator"})
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Collaborator removed",
	})
}
