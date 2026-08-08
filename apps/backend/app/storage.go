package app

import (
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/models"
	"github.com/Tsuzat/Nota/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/google/uuid"
)

// GeneratePresignedURL generates a presigned URL for uploading a file
func GeneratePresignedURL(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	req := new(utils.PresignedURLRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: err.Error()})
	}

	if !slices.Contains(utils.AllowedMimeTypes, req.ContentType) {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "Invalid or disallowed content type"})
	}

	if req.Size > utils.MaxFileSize {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "File size exceeds the 500MB limit"})
	}

	maxStorage := user.AssignedStorage

	if user.UsedStorage+req.Size > maxStorage {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "Storage quota exceeded",
			Data:   fiber.Map{"used": user.UsedStorage, "assigned": maxStorage, "required": req.Size},
		})
	}

	folder := utils.GetFolder(req.ContentType)
	extParts := strings.Split(req.Filename, ".")
	ext := "bin"
	if len(extParts) > 1 {
		ext = extParts[len(extParts)-1]
	}
	uniqueName := fmt.Sprintf("%s.%s", uuid.New().String(), ext)
	key := fmt.Sprintf("%s/%s/%s", user.Id, folder, uniqueName)

	presignedReq, err := utils.PRESIGNCLIENT.PresignPutObject(c.Context(), &s3.PutObjectInput{
		Bucket:        aws.String(config.BUCKET_NAME),
		Key:           aws.String(key),
		ContentType:   aws.String(req.ContentType),
		ContentLength: aws.Int64(req.Size),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(300 * time.Second)
	})

	if err != nil {
		log.Error("Error generating presigned URL:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to generate upload URL"})
	}

	endpoint := strings.TrimSuffix(config.R2_PUBLIC_ENDPOINT, "/")
	publicUrl := fmt.Sprintf("%s/%s", endpoint, key)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Presigned URL generated successfully",
		Data: fiber.Map{
			"uploadUrl": presignedReq.URL,
			"publicUrl": publicUrl,
			"key":       key,
		},
	})
}

// ConfirmUpload verifies the upload, records the asset in DB, and updates user storage usage
func ConfirmUpload(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userId := user.Id
	req := new(utils.ConfirmUploadRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: err.Error()})
	}

	if (req.WorkspaceId == nil || *req.WorkspaceId == "") && (req.NoteId == nil || *req.NoteId == "") {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "Either WorkspaceId or NoteId is required"})
	}

	if !strings.HasPrefix(req.Key, userId+"/") {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Invalid key ownership"})
	}

	headOutput, err := utils.S3CLIENT.HeadObject(c.Context(), &s3.HeadObjectInput{
		Bucket: aws.String(config.BUCKET_NAME),
		Key:    aws.String(req.Key),
	})

	if err != nil {
		log.Error("Error confirming upload:", err)
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "File empty or not found"})
	}

	realSize := *headOutput.ContentLength
	if realSize == 0 {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "File empty or not found"})
	}

	endpoint := strings.TrimSuffix(config.R2_PUBLIC_ENDPOINT, "/")
	publicUrl := fmt.Sprintf("%s/%s", endpoint, req.Key)

	var wId *string
	if req.WorkspaceId != nil && *req.WorkspaceId != "" {
		wId = req.WorkspaceId
	}

	// Insert Asset in Database
	asset := &models.Asset{
		UserId:      userId,
		WorkspaceId: wId,
		NoteId:      req.NoteId,
		Name:        req.Filename,
		Path:        publicUrl,
		MimeType:    req.ContentType,
		Size:        realSize,
	}

	_, err = config.DB.NewInsert().Model(asset).Exec(c.Context())
	if err != nil {
		log.Error("Error inserting asset record:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to record asset in database"})
	}

	// Update user storage in DB
	_, err = config.DB.NewUpdate().
		Model((*models.User)(nil)).
		Set("used_storage = used_storage + ?", realSize).
		Where("id = ?", userId).
		Exec(c.Context())

	if err != nil {
		log.Error("Error updating user storage:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to confirm upload"})
	}

	utils.InvalidateListCache(userId)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Upload confirmed successfully",
		Data:    asset,
	})
}

// ListFiles lists files for the user from DB with pagination, search, and caching
func ListFiles(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userId := user.Id

	page, err := strconv.Atoi(c.Query("page"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.Query("limit"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}
	search := strings.TrimSpace(c.Query("search"))
	workspaceId := strings.TrimSpace(c.Query("workspaceId"))
	mediaType := strings.TrimSpace(c.Query("type"))
	sortBy := strings.TrimSpace(c.Query("sortBy"))
	sortOrder := strings.ToLower(strings.TrimSpace(c.Query("sortOrder")))

	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	// Cache Check
	versionKey := fmt.Sprintf("storage:version:%s", userId)
	version := "0"
	if config.VALKEY != nil {
		versionBytes, _ := config.VALKEY.Get(versionKey)
		if len(versionBytes) > 0 {
			version = string(versionBytes)
		}
	}

	cacheKey := fmt.Sprintf("storage:list:%s:%s:p%d:l%d:q%s:w%s:t%s:sb%s:so%s", userId, version, page, limit, search, workspaceId, mediaType, sortBy, sortOrder)

	var cachedResult map[string]any
	if err := utils.GetCache(cacheKey, &cachedResult); err == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Fetched Files Successfully",
			Data:    cachedResult,
		})
	}

	if config.DB == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Fetched Files Successfully",
			Data: fiber.Map{
				"files": []models.Asset{},
				"total": 0,
				"page":  page,
				"limit": limit,
			},
		})
	}

	query := config.DB.NewSelect().Model((*models.Asset)(nil)).Where("user_id = ?", userId)
	if search != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(search)+"%")
	}
	if workspaceId != "" {
		query = query.Where("workspace_id = ?", workspaceId)
	}
	if mediaType != "" {
		switch mediaType {
		case "image":
			query = query.Where("mime_type LIKE ?", "image/%")
		case "video":
			query = query.Where("mime_type LIKE ?", "video/%")
		case "audio":
			query = query.Where("mime_type LIKE ?", "audio/%")
		case "document":
			query = query.Where("mime_type LIKE ? OR mime_type LIKE ? OR mime_type LIKE ?", "%pdf%", "%document%", "text/%")
		case "other":
			query = query.Where("mime_type NOT LIKE ? AND mime_type NOT LIKE ? AND mime_type NOT LIKE ? AND mime_type NOT LIKE ? AND mime_type NOT LIKE ?", "image/%", "video/%", "audio/%", "%pdf%", "text/%")
		}
	}

	orderClause := "created_at DESC"
	switch sortBy {
	case "name":
		orderClause = fmt.Sprintf("name %s", strings.ToUpper(sortOrder))
	case "size":
		orderClause = fmt.Sprintf("size %s", strings.ToUpper(sortOrder))
	case "created_at", "date":
		orderClause = fmt.Sprintf("created_at %s", strings.ToUpper(sortOrder))
	default:
		orderClause = fmt.Sprintf("created_at %s", strings.ToUpper(sortOrder))
	}

	count, err := query.Count(c.Context())
	if err != nil {
		log.Error("Count assets error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to list files"})
	}

	assets := make([]models.Asset, 0)
	err = query.Order(orderClause).Limit(limit).Offset((page-1)*limit).Scan(c.Context(), &assets)
	if err != nil {
		log.Error("List assets error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to list files"})
	}

	result := fiber.Map{
		"files": assets,
		"total": count,
		"page":  page,
		"limit": limit,
	}

	if config.VALKEY != nil {
		jsonBytes, _ := config.APP.Config().JSONEncoder(result)
		config.VALKEY.Set(cacheKey, jsonBytes, 5*time.Minute)
	}

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Fetched Files Successfully",
		Data:    result,
	})
}

// DeleteFile deletes a file from DB and S3 and refunds quota
func DeleteFile(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userId := user.Id
	req := new(utils.DeleteFileRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: err.Error()})
	}

	if req.Key != "" {
		if !strings.HasPrefix(req.Key, userId+"/") {
			return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Permission denied"})
		}
	}

	var asset models.Asset
	query := config.DB.NewSelect().Model(&asset).Where("user_id = ?", userId)
	if req.Id != "" {
		query = query.Where("id = ?", req.Id)
	} else if req.Key != "" {
		query = query.Where("path LIKE ?", "%"+req.Key)
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: "Either id or key is required"})
	}

	if err := query.Scan(c.Context()); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "File not found"})
	}

	s3Key := asset.Path
	endpoint := strings.TrimSuffix(config.R2_PUBLIC_ENDPOINT, "/")
	if strings.HasPrefix(s3Key, endpoint) {
		s3Key = strings.TrimPrefix(s3Key, endpoint+"/")
	}

	_, err := utils.S3CLIENT.DeleteObject(c.Context(), &s3.DeleteObjectInput{
		Bucket: aws.String(config.BUCKET_NAME),
		Key:    aws.String(s3Key),
	})

	if err != nil {
		log.Error("Delete S3 error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to delete file from S3"})
	}

	_, err = config.DB.NewDelete().Model(&asset).Where("id = ?", asset.Id).Exec(c.Context())
	if err != nil {
		log.Error("Delete asset DB error:", err)
	}

	if asset.Size > 0 {
		_, err = config.DB.NewUpdate().
			Model((*models.User)(nil)).
			Set("used_storage = GREATEST(0, used_storage - ?)", asset.Size).
			Where("id = ?", userId).
			Exec(c.Context())

		if err != nil {
			log.Error("Error refunding storage:", err)
		}
	}

	utils.InvalidateListCache(userId)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "File deleted successfully",
		Data: fiber.Map{
			"refunded": asset.Size,
			"id":       asset.Id,
		},
	})
}
