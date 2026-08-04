package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitAIRouter() {
	group := config.APP.Group("/api/v1/ai", middleware.Authenticate)
	group.Post("/generate", app.GenerateContent)
}
