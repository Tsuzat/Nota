package app

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/klauspost/compress/zstd"
	"github.com/uptrace/bun"
)

var (
	zstdEncoder, _ = zstd.NewWriter(nil)
	zstdDecoder, _ = zstd.NewReader(nil)
)

func userHasNoteReadAccess(ctx context.Context, noteId string, userId string) bool {
	cacheKey := fmt.Sprintf("note_access_read:%s:%s", noteId, userId)
	var hasAccess bool
	if utils.GetCache(cacheKey, &hasAccess) == nil {
		return hasAccess
	}
	exists, _ := config.DB.NewSelect().
		Model((*models.Note)(nil)).
		Where("id = ? AND (owner = ? OR id IN (SELECT note_id FROM note_collaborators WHERE user_id = ?))", noteId, userId, userId).
		Exists(ctx)
	
	go utils.SetCache(cacheKey, exists, 5*time.Minute)
	return exists
}

func userHasNoteWriteAccess(ctx context.Context, noteId string, userId string) bool {
	cacheKey := fmt.Sprintf("note_access_write:%s:%s", noteId, userId)
	var hasAccess bool
	if utils.GetCache(cacheKey, &hasAccess) == nil {
		return hasAccess
	}
	exists, _ := config.DB.NewSelect().
		Model((*models.Note)(nil)).
		Where("id = ? AND (owner = ? OR id IN (SELECT note_id FROM note_collaborators WHERE user_id = ? AND role IN ('editor', 'admin')))", noteId, userId, userId).
		Exists(ctx)
	
	go utils.SetCache(cacheKey, exists, 5*time.Minute)
	return exists
}

func ListWorkspaceVersions(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	workspaceId := c.Params("workspaceId")

	noteIds := c.Query("note_ids")
	versionTypes := c.Query("type")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var versions []models.NoteVersionListItem

	query := config.DB.NewSelect().
		Model((*models.NoteVersion)(nil)).
		Column("id", "note_id", "workspace_id", "content_hash", "size_bytes", "compressed_size_bytes", "version_type", "label", "created_by", "created_at").
		Where("workspace_id = ?", workspaceId)

	// In Nota, if you have access to a workspace, you can see all versions within it,
	// but we should ideally ensure the user has access to the workspace or notes.
	// For simplicity, we just filter by notes owned by the user or part of the workspace.
	// Ensure the user actually has access to this workspace via a join or explicit check:
	exists, err := config.DB.NewSelect().Model((*models.Workspace)(nil)).Where("id = ? AND owner = ?", workspaceId, user.Id).Exists(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Error checking workspace access"})
	}
	if !exists {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	if noteIds != "" {
		ids := strings.Split(noteIds, ",")
		query.Where("note_id IN (?)", bun.In(ids))
	}
	if versionTypes != "" {
		types := strings.Split(versionTypes, ",")
		query.Where("version_type IN (?)", bun.In(types))
	}
	if search != "" {
		query.Where("label ILIKE ?", "%"+search+"%")
	}

	count, err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		ScanAndCount(c.Context(), &versions)

	if err != nil {
		log.Error("Error listing versions: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Error listing versions", Data: err.Error()})
	}

	return c.JSON(fiber.Map{
		"status":  fiber.StatusOK,
		"message": "Versions retrieved successfully",
		"data": fiber.Map{
			"versions": versions,
			"total":    count,
			"page":     page,
			"limit":    limit,
		},
	})
}

func GetNoteVersionCount(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")

	if !userHasNoteReadAccess(c.Context(), noteId, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	cacheKey := fmt.Sprintf("note_versions_count:%s", noteId)
	var count int
	if utils.GetCache(cacheKey, &count) == nil {
		return c.JSON(models.APIResponse{Status: 200, Message: "Count retrieved", Data: fiber.Map{"count": count}})
	}

	count, err := config.DB.NewSelect().Model((*models.NoteVersion)(nil)).Where("note_id = ?", noteId).Count(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Error counting versions"})
	}

	go utils.SetCache(cacheKey, count, time.Hour)

	return c.JSON(models.APIResponse{Status: 200, Message: "Count retrieved", Data: fiber.Map{"count": count}})
}

func GetNoteVersion(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")
	versionId := c.Params("versionId")

	if !userHasNoteReadAccess(c.Context(), noteId, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	var version models.NoteVersion
	if err := config.DB.NewSelect().Model(&version).Where("id = ? AND note_id = ?", versionId, noteId).Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: 404, Error: "Version not found"})
	}

	decompressed, err := zstdDecoder.DecodeAll(version.ContentCompressed, nil)
	if err != nil {
		log.Error("Error decompressing version content: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to read content"})
	}

	var data map[string]any
	if err := json.Unmarshal(decompressed, &data); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to parse content"})
	}

	return c.JSON(models.APIResponse{Status: 200, Message: "Version retrieved", Data: data})
}

func CreateManualSnapshot(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")

	req := new(models.CreateManualSnapshotRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: 400, Error: "Invalid request"})
	}

	if !userHasNoteWriteAccess(c.Context(), noteId, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	var note models.Note
	if err := config.DB.NewSelect().Model(&note).Where("id = ?", noteId).Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: 404, Error: "Note not found"})
	}

	if user.SubscriptionPlan != config.PRO_PLAN {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "Cloud snapshots are only available on the Pro plan.",
		})
	}

	// Compute snapshot content
	contentJson, err := json.Marshal(note.Content)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Error encoding content"})
	}

	hashBytes := sha256.Sum256(contentJson)
	hashStr := hex.EncodeToString(hashBytes[:])
	compressed := zstdEncoder.EncodeAll(contentJson, make([]byte, 0, len(contentJson)))

	// Quota check
	if user.SubscriptionPlan != "pro" {
		if user.UsedStorage+int64(len(compressed)) > user.AssignedStorage {
			return c.Status(fiber.StatusPaymentRequired).JSON(models.APIError{Status: fiber.StatusPaymentRequired, Error: "Storage quota exceeded. Upgrade to Pro."})
		}
	}

	version := models.NoteVersion{
		NoteId:              note.Id,
		WorkspaceId:         note.WorkspaceId,
		ContentCompressed:   compressed,
		ContentHash:         hashStr,
		SizeBytes:           len(contentJson),
		CompressedSizeBytes: len(compressed),
		VersionType:         "manual",
		Label:               req.Label,
		CreatedBy:           &user.Id,
	}

	if _, err := config.DB.NewInsert().Model(&version).Exec(c.Context()); err != nil {
		log.Error("Error creating manual snapshot: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to create snapshot"})
	}

	// Update storage
	if _, err := config.DB.NewUpdate().Model(user).Set("used_storage = used_storage + ?", len(compressed)).WherePK().Exec(c.Context()); err != nil {
		log.Error("Failed to update used_storage", err)
	}

	go utils.DeleteCache(fmt.Sprintf("note_versions_latest:%s", noteId))
	go utils.DeleteCache(fmt.Sprintf("note_versions_count:%s", noteId))

	version.ContentCompressed = nil // Don't return blob
	return c.JSON(models.APIResponse{Status: 200, Message: "Manual snapshot created", Data: version})
}

func DeleteNoteVersion(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")
	versionId := c.Params("versionId")

	var version models.NoteVersion
	if err := config.DB.NewSelect().Model(&version).Where("id = ? AND note_id = ?", versionId, noteId).Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: 404, Error: "Version not found"})
	}

	if version.VersionType != "manual" {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Only manual snapshots can be deleted"})
	}

	if !userHasNoteWriteAccess(c.Context(), noteId, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	if _, err := config.DB.NewDelete().Model(&version).WherePK().Exec(c.Context()); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to delete snapshot"})
	}

	if version.CreatedBy != nil && *version.CreatedBy == user.Id {
		if _, err := config.DB.NewUpdate().Model(user).Set("used_storage = GREATEST(used_storage - ?, 0)", version.CompressedSizeBytes).WherePK().Exec(c.Context()); err != nil {
			log.Error("Failed to update used_storage", err)
		}
	}

	go utils.DeleteCache(fmt.Sprintf("note_versions_latest:%s", noteId))
	go utils.DeleteCache(fmt.Sprintf("note_versions_count:%s", noteId))

	return c.JSON(models.APIResponse{Status: 200, Message: "Version deleted"})
}

func RestoreNoteVersion(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")
	versionId := c.Params("versionId")

	if !userHasNoteWriteAccess(c.Context(), noteId, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	// Fetch note
	var note models.Note
	if err := config.DB.NewSelect().Model(&note).Where("id = ?", noteId).Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: 404, Error: "Note not found"})
	}

	// Fetch version to restore
	var versionToRestore models.NoteVersion
	if err := config.DB.NewSelect().Model(&versionToRestore).Where("id = ? AND note_id = ?", versionId, noteId).Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: 404, Error: "Version not found"})
	}

	decompressed, err := zstdDecoder.DecodeAll(versionToRestore.ContentCompressed, nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to read content"})
	}

	var data map[string]any
	if err := json.Unmarshal(decompressed, &data); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to parse content"})
	}

	// Create restore point of current content
	contentJson, err := json.Marshal(note.Content)
	if err != nil {
		log.Error("Failed to marshal existing note content during restore: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to backup current state"})
	}
	hashBytes := sha256.Sum256(contentJson)
	hashStr := hex.EncodeToString(hashBytes[:])
	compressed := zstdEncoder.EncodeAll(contentJson, make([]byte, 0, len(contentJson)))

	restoreLabel := "Restore point"
	restorePoint := models.NoteVersion{
		NoteId:              note.Id,
		WorkspaceId:         note.WorkspaceId,
		ContentCompressed:   compressed,
		ContentHash:         hashStr,
		SizeBytes:           len(contentJson),
		CompressedSizeBytes: len(compressed),
		VersionType:         "restore",
		Label:               &restoreLabel,
		CreatedBy:           &user.Id,
	}

	// Transaction to save restore point and update note
	err = config.DB.RunInTx(c.Context(), nil, func(ctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(&restorePoint).Exec(ctx); err != nil {
			return err
		}
		if _, err := tx.NewUpdate().Model(&note).Set("content = ?", data).Set("updated_at = ?", time.Now()).WherePK().Exec(ctx); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		log.Error("Restore failed: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Restore failed"})
	}

	// Invalidate caches
	go utils.DeleteCache(fmt.Sprintf("note_versions_latest:%s", noteId))
	go utils.DeleteCache(fmt.Sprintf("note_versions_count:%s", noteId))
	go utils.DeleteCache(fmt.Sprintf("note:%s:preview", noteId))
	go utils.DeleteCache(fmt.Sprintf("note:%s:content", noteId))

	return c.JSON(models.APIResponse{Status: 200, Message: "Restored successfully", Data: data})
}

// RestoreNoteFromContent restores a cloud note using content supplied by the client (e.g. from a local snapshot)
func RestoreNoteFromContent(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	noteId := c.Params("id")

	req := new(models.RestoreFromContentRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: 400, Error: "Invalid request body"})
	}

	if req.Content == nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: 400, Error: "Content is required"})
	}

	// Fetch note and verify ownership
	if !userHasNoteWriteAccess(c.Context(), noteId, user.Id) {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: 403, Error: "Forbidden"})
	}

	var note models.Note
	if err := config.DB.NewSelect().Model(&note).Where("id = ?", noteId).Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: 404, Error: "Note not found"})
	}

	// Create restore point of current content
	currentJson, err := json.Marshal(note.Content)
	if err != nil {
		log.Error("Failed to marshal existing note content during restore-from-content: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Failed to backup current state"})
	}
	currentHash := sha256.Sum256(currentJson)
	currentHashStr := hex.EncodeToString(currentHash[:])
	currentCompressed := zstdEncoder.EncodeAll(currentJson, make([]byte, 0, len(currentJson)))

	restoreLabel := "Restore point"
	if req.Label != nil {
		restoreLabel = *req.Label
	}
	restorePoint := models.NoteVersion{
		NoteId:              note.Id,
		WorkspaceId:         note.WorkspaceId,
		ContentCompressed:   currentCompressed,
		ContentHash:         currentHashStr,
		SizeBytes:           len(currentJson),
		CompressedSizeBytes: len(currentCompressed),
		VersionType:         "restore",
		Label:               &restoreLabel,
		CreatedBy:           &user.Id,
	}

	// Transaction: save restore point + update note content
	err = config.DB.RunInTx(c.Context(), nil, func(ctx context.Context, tx bun.Tx) error {
		if _, err := tx.NewInsert().Model(&restorePoint).Exec(ctx); err != nil {
			return err
		}
		if _, err := tx.NewUpdate().Model(&note).Set("content = ?", req.Content).Set("updated_at = ?", time.Now()).WherePK().Exec(ctx); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		log.Error("RestoreFromContent failed: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: 500, Error: "Restore failed"})
	}

	// Invalidate caches
	go utils.DeleteCache(fmt.Sprintf("note_versions_latest:%s", noteId))
	go utils.DeleteCache(fmt.Sprintf("note_versions_count:%s", noteId))
	go utils.DeleteCache(fmt.Sprintf("note:%s:preview", noteId))
	go utils.DeleteCache(fmt.Sprintf("note:%s:content", noteId))

	return c.JSON(models.APIResponse{Status: 200, Message: "Restored from content successfully", Data: req.Content})
}

// maybeAutoSnapshot is called as a goroutine after a successful patch operation
func maybeAutoSnapshot(ctx context.Context, noteId string, userId string) {
	var note models.Note
	if err := config.DB.NewSelect().Model(&note).Where("id = ?", noteId).Scan(ctx); err != nil {
		log.Error("maybeAutoSnapshot: failed to fetch note: ", err)
		return
	}

	contentJson, err2 := json.Marshal(note.Content)
	if err2 != nil {
		log.Error("maybeAutoSnapshot: failed to marshal content: ", err2)
		return
	}

	hashBytes := sha256.Sum256(contentJson)
	hashStr := hex.EncodeToString(hashBytes[:])

	cacheKey := fmt.Sprintf("note_versions_latest:%s", noteId)
	var latestMeta models.LatestVersionMeta
	var foundLatest bool

	// Check cache
	if err := utils.GetCache(cacheKey, &latestMeta); err == nil {
		foundLatest = true
	} else {
		// Cache miss, fallback to DB
		var latestVersion models.NoteVersion
		err := config.DB.NewSelect().Model(&latestVersion).Where("note_id = ?", noteId).Order("created_at DESC").Limit(1).Scan(ctx)
		if err == nil {
			foundLatest = true
			latestMeta = models.LatestVersionMeta{
				ContentHash: latestVersion.ContentHash,
				VersionType: latestVersion.VersionType,
				CreatedAt:   latestVersion.CreatedAt,
			}
			go utils.SetCache(cacheKey, latestMeta, 24*time.Hour)
		}
	}

	if foundLatest {
		// Skip if content hasn't changed from the absolute latest version
		if latestMeta.ContentHash == hashStr {
			return
		}

		// Check 10 minute cooldown for 'auto' types
		if latestMeta.VersionType == "auto" && time.Since(latestMeta.CreatedAt) < 10*time.Minute {
			return
		}
	}

	compressed := zstdEncoder.EncodeAll(contentJson, make([]byte, 0, len(contentJson)))

	version := models.NoteVersion{
		NoteId:              note.Id,
		WorkspaceId:         note.WorkspaceId,
		ContentCompressed:   compressed,
		ContentHash:         hashStr,
		SizeBytes:           len(contentJson),
		CompressedSizeBytes: len(compressed),
		VersionType:         "auto",
		CreatedBy:           &userId,
	}

	if _, err := config.DB.NewInsert().Model(&version).Exec(ctx); err != nil {
		log.Error("maybeAutoSnapshot: failed to insert version: ", err)
		return
	}

	// Update cache with the new version
	newMeta := models.LatestVersionMeta{
		ContentHash: hashStr,
		VersionType: "auto",
		CreatedAt:   time.Now(),
	}
	go utils.SetCache(cacheKey, newMeta, 24*time.Hour)
	go utils.DeleteCache(fmt.Sprintf("note_versions_count:%s", noteId))
}
