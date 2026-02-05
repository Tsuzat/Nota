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
	group.Delete("/", app.DeleteFile)
}
