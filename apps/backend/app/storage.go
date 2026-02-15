package app

import (
	"fmt"
	"slices"
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

	if user.UsedStorage+req.Size > user.AssignedStorage {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{
			Status: fiber.StatusForbidden,
			Error:  "Storage quota exceeded",
			Data:   fiber.Map{"used": user.UsedStorage, "assigned": user.AssignedStorage, "required": req.Size},
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

// ConfirmUpload verifies the upload and updates user storage usage
func ConfirmUpload(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userId := user.Id
	req := new(utils.ConfirmUploadRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: err.Error()})
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
		Data: fiber.Map{
			"size": realSize,
		},
	})
}

// ListFiles lists files for the user with caching
func ListFiles(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userId := user.Id

	// Cache Check
	versionKey := fmt.Sprintf("storage:version:%s", userId)
	versionBytes, _ := config.VALKEY.Get(versionKey)
	version := "0"
	if len(versionBytes) > 0 {
		version = string(versionBytes)
	}

	cacheKey := fmt.Sprintf("storage:list:%s:%s", userId, version)

	files := make([]map[string]any, 0)
	if err := utils.GetCache(cacheKey, &files); err == nil {
		return c.JSON(models.APIResponse{
			Status:  fiber.StatusOK,
			Message: "Fetched Files Successfully",
			Data:    files,
		})
	}

	searchPrefix := userId + "/"

	listOutput, err := utils.S3CLIENT.ListObjectsV2(c.Context(), &s3.ListObjectsV2Input{
		Bucket: aws.String(config.BUCKET_NAME),
		Prefix: aws.String(searchPrefix),
	})

	if err != nil {
		log.Error("List files error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to list files"})
	}

	endpoint := strings.TrimSuffix(config.R2_PUBLIC_ENDPOINT, "/")

	for _, item := range listOutput.Contents {
		files = append(files, map[string]any{
			"key":          *item.Key,
			"size":         item.Size,
			"lastModified": item.LastModified,
			"url":          fmt.Sprintf("%s/%s", endpoint, *item.Key),
		})
	}

	jsonBytes, _ := config.APP.Config().JSONEncoder(files)
	config.VALKEY.Set(cacheKey, jsonBytes, 10*time.Minute)

	return c.JSON(models.APIResponse{
		Status:  fiber.StatusOK,
		Message: "Fetched Files Successfully",
		Data:    files,
	})
}

// DeleteFile deletes a file and refunds quota
func DeleteFile(c fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	userId := user.Id
	req := new(utils.ConfirmUploadRequest)
	if err := c.Bind().Body(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Status: fiber.StatusBadRequest, Error: err.Error()})
	}
	key := req.Key

	if !strings.HasPrefix(key, userId+"/") {
		return c.Status(fiber.StatusForbidden).JSON(models.APIError{Status: fiber.StatusForbidden, Error: "Permission denied"})
	}

	headOutput, err := utils.S3CLIENT.HeadObject(c.Context(), &s3.HeadObjectInput{
		Bucket: aws.String(config.BUCKET_NAME),
		Key:    aws.String(key),
	})

	if err != nil {
		// Check for 404
		// In aws-sdk-go-v2 checking error types is a bit verbose
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Status: fiber.StatusNotFound, Error: "File not found"})
	}

	size := *headOutput.ContentLength

	_, err = utils.S3CLIENT.DeleteObject(c.Context(), &s3.DeleteObjectInput{
		Bucket: aws.String(config.BUCKET_NAME),
		Key:    aws.String(key),
	})

	if err != nil {
		log.Error("Delete error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Status: fiber.StatusInternalServerError, Error: "Failed to delete file"})
	}

	if size > 0 {
		// Refund storage
		_, err = config.DB.NewUpdate().
			Model((*models.User)(nil)).
			Set("used_storage = GREATEST(0, used_storage - ?)", size).
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
			"refunded": size,
		},
	})
}
