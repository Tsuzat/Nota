package utils

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/Tsuzat/Nota/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	v2Config "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v3/log"
)

type PresignedURLRequest struct {
	Filename    string `json:"filename" validate:"required"`
	ContentType string `json:"contentType" validate:"required"`
	Size        int64  `json:"size" validate:"required,min=1"`
}

type ConfirmUploadRequest struct {
	Key string `json:"key" validate:"required"`
}

var (
	S3CLIENT         *s3.Client
	PRESIGNCLIENT    *s3.PresignClient
	AllowedMimeTypes = []string{
		// Images
		"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp", "image/tiff",
		// Video
		"video/mp4", "video/webm", "video/ogg", "video/quicktime",
		// Audio
		"audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac",
		// Documents
		"application/pdf", "text/plain", "text/markdown", "text/csv", "application/json", "application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
	}
	MaxFileSize int64 = 50 * 1024 * 1024 // 50 MB
)

// InitS3 initializes the S3 client using configuration from config package
func InitS3() error {
	cfg, err := v2Config.LoadDefaultConfig(context.TODO(),
		v2Config.WithRegion("auto"),
		v2Config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			config.R2_ACCESS_ID,
			config.R2_SECRETE_ACCESS_KEY,
			"",
		)),
	)
	if err != nil {
		log.Error("Failed to load AWS config:", err)
		return err
	}

	S3CLIENT = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", config.R2_ACCOUNT_ID))
	})
	PRESIGNCLIENT = s3.NewPresignClient(S3CLIENT)
	return nil
}

func GetFolder(mime string) string {
	if strings.HasPrefix(mime, "image/") {
		return "images"
	}
	if strings.HasPrefix(mime, "video/") {
		return "videos"
	}
	if strings.HasPrefix(mime, "audio/") {
		return "audios"
	}
	if mime == "application/pdf" || strings.HasPrefix(mime, "text/") || strings.Contains(mime, "document") {
		return "docs"
	}
	return "others"
}

func InvalidateListCache(userId string) {
	// Increment version key to invalidate cache
	versionKey := fmt.Sprintf("storage:version:%s", userId)

	// Since fiber/storage/valkey interface is limited, we get, incr, set
	// Note: This is not atomic without Lua or Incr support, but sufficient for this cache invalidation pattern
	val, err := config.VALKEY.Get(versionKey)
	var currentVersion int64 = 0
	if err == nil && len(val) > 0 {
		currentVersion, _ = strconv.ParseInt(string(val), 10, 64)
	}

	newVersion := currentVersion + 1
	config.VALKEY.Set(versionKey, []byte(fmt.Sprintf("%d", newVersion)), 0)
}
