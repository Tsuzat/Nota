package app

import (
	"fmt"
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

func GetNotes(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	// this is the userworkspace id, the notes belong to
	id := c.Params("id")

	notes := []models.Note{}
	// check it on redis cache first ??
	cacheKey := fmt.Sprintf("notes:%s:%s", id, user.Id)
	if utils.GetCache(cacheKey, &notes) == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Notes retrieved successfully",
			Data:    notes,
		})
	}
	// there might be an error when unmarshalling the cache data or the cache data is empty
	// so we need to query the database
	if err := config.DB.NewSelect().
		Model(&notes).
		Column("id", "name", "icon", "workspace", "userworkspace", "owner", "favorite", "trashed", "created_at", "updated_at", "is_public").
		Where("userworkspace = ? AND owner = ?", id, user.Id).
		Scan(c.Context()); err != nil {
		log.Error("Error when getting notes: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	go utils.SetCache(cacheKey, notes, time.Minute*15)

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
	// invalidate the cache
	cacheKey := fmt.Sprintf("notes:%s:%s", note.UserWorkspace, user.Id)
	go config.VALKEY.Delete(cacheKey)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note created successfully",
		Data:    note,
	})
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
	// invalidate the cache
	cacheKey := fmt.Sprintf("notes:%s:%s", note.UserWorkspace, user.Id)
	go config.VALKEY.Delete(cacheKey)
	// invalidate the cache for note preview
	cacheKey = fmt.Sprintf("note:%s:preview", id)
	go config.VALKEY.Delete(cacheKey)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note updated successfully",
		Data:    note,
	})
}

func DeleteNote(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	var userworkspace string
	if _, err := config.DB.NewDelete().
		Model(&models.Note{}).
		Returning("userworkspace").
		Where("id = ? AND owner = ?", id, user.Id).
		Exec(c.Context(), &userworkspace); err != nil {
		log.Error("Error when deleting note: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Error when deleting note",
			Data:   err.Error(),
		})
	}
	// invalidate the cache
	cacheKey := fmt.Sprintf("notes:%s:%s", userworkspace, user.Id)
	go config.VALKEY.Delete(cacheKey)
	// invalidate the cache for note preview
	cacheKey = fmt.Sprintf("note:%s:preview", id)
	go config.VALKEY.Delete(cacheKey)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note deleted successfully",
	})
}

func GetNoteContent(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	note := models.Note{}
	if err := config.DB.NewSelect().
		Model(&note).
		Column("content").
		Where("id = ? AND owner = ?", id, user.Id).
		Scan(c.Context()); err != nil {
		log.Error("Error when getting note content: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Error when getting note content",
			Data:   err.Error(),
		})
	}
	log.Info("Note content: ", note)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note content retrieved successfully",
		Data:    note.Content,
	})
}

func ApplyNoteContentPatch(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")

	var patch []models.NotePatchOperation
	if err := c.Bind().Body(&patch); err != nil {
		log.Error("Error binding patch: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Invalid patch format",
			Data:   err.Error(),
		})
	}

	wrapper := fiber.Map{"p": patch}
	wrapperJSON, err := json.Marshal(wrapper)
	if err != nil {
		log.Error("Error marshaling wrapper: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to process patch",
		})
	}

	if _, err := config.DB.NewRaw("SELECT apply_note_patch(?, (?::jsonb)->'p', ?)", noteId, string(wrapperJSON), user.Id).Exec(c.Context()); err != nil {
		log.Error("Error patching note: ", err)
		errMsg := err.Error()
		if strings.Contains(errMsg, "Permission denied") {
			return c.Status(fiber.StatusForbidden).JSON(models.APIError{
				Status: fiber.StatusForbidden,
				Error:  "Unauthorized",
				Data:   errMsg,
			})
		}
		if strings.Contains(errMsg, "Note not found") {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{
				Status: fiber.StatusNotFound,
				Error:  "Note not found",
				Data:   errMsg,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to patch note content",
			Data:   errMsg,
		})
	}
	// invalidate the cache for note preview
	cacheKey := fmt.Sprintf("note:%s:preview", noteId)
	go config.VALKEY.Delete(cacheKey)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note content patched successfully",
	})
}

func GetNotePreview(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		log.Error("Note id is empty")
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Note id is empty",
		})
	}
	log.Info("Note Preview Requested for id: ", id)
	note := models.Note{}
	cacheKey := fmt.Sprintf("note:%s:preview", id)
	if utils.GetCache(cacheKey, &note) == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Note retrieved successfully",
			Data:    note,
		})
	}
	note.Id = id
	if err := config.DB.NewSelect().
		Model(&note).
		WherePK().
		Scan(c.Context()); err != nil {
		log.Error("Error when getting note preview: ", err)
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{
			Status: fiber.StatusNotFound,
			Error:  "Note not found",
			Data:   err.Error(),
		})
	}
	if note.IsPublic {
		// set cache
		go utils.SetCache(cacheKey, note, time.Minute*30)
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Note preview retrieved successfully",
			Data:    note,
		})
	}
	log.Info("Note is not public. Checking auth...")

	// if note is not public, check the auth
	user, err := middleware.AuthenticatedUser(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIError{
			Status: fiber.StatusUnauthorized,
			Error:  "User is not authenticated",
			Data:   err.Error(),
		})
	}
	if note.Owner != user.Id {
		log.Error("User is not the owner of the note")
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "User is not the owner of the note",
		})
	}
	// cache the note preview
	go utils.SetCache(cacheKey, note, time.Minute*30)
	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Note preview retrieved successfully",
		Data:    note,
	})
}

func DuplicateNote(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	note := new(models.Note)

	if err := config.DB.NewRaw(
		`INSERT INTO notes (name, icon, workspace, userworkspace, owner, content, favorite, trashed, created_at, updated_at)
		 SELECT name || ' (copy)', icon, workspace, userworkspace, owner, content, false, false, NOW(), NOW()
		 FROM notes
		 WHERE id = ? AND owner = ?
		 RETURNING id, name, icon, workspace, userworkspace, owner, favorite, trashed, created_at, updated_at`,
		id, user.Id,
	).Scan(c.Context(), note); err != nil {
		log.Error("Error when duplicating note: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to duplicate note",
			Data:   err.Error(),
		})
	}
	// invalidate the GetNotes cache for the userworkspace
	cacheKey := fmt.Sprintf("notes:%s:%s", note.UserWorkspace, user.Id)
	go config.VALKEY.Delete(cacheKey)
	return c.Status(fiber.StatusCreated).JSON(models.APIResponse{
		Status:  fiber.StatusCreated,
		Message: "Note duplicated successfully",
		Data:    note,
	})
}

func ImportNote(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	req := new(models.ImportNoteRequest)
	if err := c.Bind().Body(&req); err != nil {
		log.Error("Error when parsing import note request: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{
			Status: fiber.StatusBadRequest,
			Error:  "Error when parsing import note request",
			Data:   err.Error(),
		})
	}
	note := &models.Note{
		Name:          req.Name,
		Workspace:     req.Workspace,
		UserWorkspace: req.UserWorkspace,
		Owner:         user.Id,
		Content:       req.Content,
	}
	if _, err := config.DB.NewInsert().
		Model(note).
		Returning("id, name, icon, workspace, userworkspace, owner, favorite, trashed, created_at, updated_at").
		Exec(c.Context()); err != nil {
		log.Error("Error when importing note: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{
			Status: fiber.StatusInternalServerError,
			Error:  "Failed to import note",
			Data:   err.Error(),
		})
	}
	// Invalidate the GetNotes cache for the userworkspace
	cacheKey := fmt.Sprintf("notes:%s:%s", note.UserWorkspace, user.Id)
	go config.VALKEY.Delete(cacheKey)
	return c.Status(fiber.StatusCreated).JSON(models.APIResponse{
		Status:  fiber.StatusCreated,
		Message: "Note imported successfully",
		Data:    note,
	})
}
