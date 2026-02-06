package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitUserWorkspaceRoutes() {
	group := config.APP.Group("/api/v1/db/userworkspace", middleware.Authenticate)

	group.Get("/", app.GetUserWorkspaces)

}
