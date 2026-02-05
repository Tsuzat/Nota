package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitStorageRouter() {
	group := config.APP.Group("/api/v1/storage", middleware.Authenticate)

	group.Post("/presigned-url", app.GeneratePresignedURL)
	group.Post("/confirm", app.ConfirmUpload)
	group.Get("/list", app.ListFiles)
	// Use wildcard for key to handle slashes correctly if needed, though Fiber params usually stop at slash
	// For keys like "userId/folder/file.ext", we need to ensure the router captures the full path.
	// In Fiber v3 /:key should capture it if encoded, or use *
	group.Delete("/:key", app.DeleteFile)
}
