package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitSessionRouter() {
	group := config.APP.Group("/api/v1/session", middleware.Authenticate)

	group.Get("/all", app.GetUserSessions)
	group.Post("/revoke/:id<guid>", app.RevokeSession)
	group.Post("/revoke/all", app.RevokeAllSessions)
	group.Delete("/:id<guid>", app.DeleteSession)
	group.Delete("/all", app.DeleteAllSessions)
}
