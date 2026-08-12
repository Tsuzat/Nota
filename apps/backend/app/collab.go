package app

import (
	"context"
	"encoding/base64"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
	"github.com/Tsuzat/Nota/models"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

// CheckNoteAccess verifies whether the authenticated user can access the
// given note. It first checks the note_collaborators table, then falls
// back to the notes.owner column (owners have implicit "owner" access).
//
// Called by the collaboration server during the Hocuspocus onAuthenticate hook.
func CheckNoteAccess(c fiber.Ctx) error {
	// Authenticate the user via the forwarded access_token
	user, err := middleware.AuthenticatedUser(c)
	if err != nil {
		log.Error("Collab auth - user authentication failed: ", err)
		statusCode := fiber.StatusUnauthorized
		errorMessage := "User is not authenticated"
		if err == fiber.ErrForbidden {
			statusCode = fiber.StatusForbidden
			errorMessage = "Token is expired"
		}
		return c.Status(statusCode).JSON(models.APIError{
			Status: statusCode,
			Error:  errorMessage,
		})
	}

	noteId := c.Params("noteId")

	// 1. Check note_collaborators table
	var collab models.NoteCollaborator
	err = config.DB.NewSelect().
		Model(&collab).
		Where("note_id = ? AND user_id = ?", noteId, user.Id).
		Scan(c.Context())

	if err == nil {
		// Found a collaborator row
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Access granted",
			Data: models.CollabAccessResponse{
				UserId:     user.Id,
				UserName:   user.Name,
				UserAvatar: user.AvatarUrl,
				Role:       collab.Role,
				ReadOnly:   collab.Role == "viewer",
			},
		})
	}

	// 2. Fallback: check if the user owns the note
	var note models.Note
	err = config.DB.NewSelect().
		Model(&note).
		Column("id", "owner").
		Where("id = ? AND owner = ?", noteId, user.Id).
		Scan(c.Context())

	if err != nil {
		log.Error("Collab auth - note not found or not owned: ", err)
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "Not authorized for this note",
		})
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Access granted",
		Data: models.CollabAccessResponse{
			UserId:     user.Id,
			UserName:   user.Name,
			UserAvatar: user.AvatarUrl,
			Role:       "owner",
			ReadOnly:   false,
		},
	})
}

// LoadYDoc returns the stored Y.js binary state for a note.
// Called by the collaboration server during Hocuspocus onLoadDocument.
// Returns 404 if no ydoc state exists (brand-new doc).
func LoadYDoc(c fiber.Ctx) error {
	noteId := c.Params("noteId")

	var ydocState []byte
	err := config.DB.NewSelect().
		Model((*models.Note)(nil)).
		Column("ydoc_state").
		Where("id = ?", noteId).
		Scan(c.Context(), &ydocState)

	if err != nil {
		log.Error("LoadYDoc – note not found: ", err)
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{
			Status: fiber.StatusNotFound,
			Error:  "Note not found",
		})
	}

	if len(ydocState) == 0 {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{
			Status: fiber.StatusNotFound,
			Error:  "No ydoc state stored yet",
		})
	}

	c.Set("Content-Type", "application/octet-stream")
	return c.Send(ydocState)
}

// StoreYDoc persists the Y.js binary state for a note.
// Called by the collaboration server during Hocuspocus onStoreDocument.
func StoreYDoc(c fiber.Ctx) error {
	noteId := c.Params("noteId")
	isInternal := c.Get("X-Internal-Api-Key") == config.INTERNAL_API_KEY
	var user *models.User

	if !isInternal {
		// Authenticate the user via the forwarded access_token
		var err error
		user, err = middleware.AuthenticatedUser(c)
		if err != nil {
			log.Error("StoreYDoc - user authentication failed: ", err)
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
				Status: fiber.StatusUnauthorized,
				Error:  "User is not authenticated",
			})
		}

		// Check access permissions (must be owner or editor/admin)
		hasAccess := false

		var note models.Note
		err = config.DB.NewSelect().
			Model(&note).
			Column("owner").
			Where("id = ?", noteId).
			Scan(c.Context())

		if err != nil {
			log.Error("StoreYDoc - note not found: ", err)
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status: fiber.StatusNotFound,
				Error:  "Note not found",
			})
		}

		if note.Owner == user.Id {
			hasAccess = true
		} else {
			var collab models.NoteCollaborator
			err = config.DB.NewSelect().
				Model(&collab).
				Where("note_id = ? AND user_id = ?", noteId, user.Id).
				Scan(c.Context())

			if err == nil && (collab.Role == "editor" || collab.Role == "admin") {
				hasAccess = true
			}
		}

		if !hasAccess {
			log.Error("StoreYDoc - user lacks write permission")
			return c.Status(fiber.StatusForbidden).JSON(models.APIError{
				Status: fiber.StatusForbidden,
				Error:  "Not authorized to modify this note",
			})
		}
	}

	var req struct {
		YDocState string         `json:"ydoc_state"`
		Content   map[string]any `json:"content"`
	}

	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid payload",
		})
	}

	if req.YDocState == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Empty ydoc state",
		})
	}

	ydocBytes, err := base64.StdEncoding.DecodeString(req.YDocState)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid base64 ydoc_state",
		})
	}

	_, err = config.DB.NewUpdate().
		Model((*models.Note)(nil)).
		Set("ydoc_state = ?", ydocBytes).
		Set("content = ?", req.Content).
		Where("id = ?", noteId).
		Exec(c.Context())

	if err != nil {
		log.Error("StoreYDoc - failed to save: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to store ydoc state",
		})
	}

	// Trigger auto-snapshot for Pro plan users
	if user != nil {
		if user.SubscriptionPlan == config.PRO_PLAN {
			go maybeAutoSnapshot(context.Background(), noteId, user.Id, ydocBytes)
		}
	} else {
		// Internal call from collaboration server - check note owner's subscription plan
		var note models.Note
		if err := config.DB.NewSelect().Model(&note).Column("owner").Where("id = ?", noteId).Scan(c.Context()); err == nil {
			var ownerUser models.User
			if err := config.DB.NewSelect().Model(&ownerUser).Column("subscription_plan").Where("id = ?", note.Owner).Scan(c.Context()); err == nil {
				if ownerUser.SubscriptionPlan == config.PRO_PLAN {
					go maybeAutoSnapshot(context.Background(), noteId, ownerUser.Id, ydocBytes)
				}
			}
		}
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "YDoc state saved",
	})
}
