package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitWorkspaceRoutes() {
	group := config.APP.Group("/api/v1/db/workspace", middleware.Authenticate)

	group.Get("/:id<guid>", app.GetWorkspaces)
	group.Post("/", app.CreateWorkspace)
	group.Patch("/:id<guid>", app.UpdateWorkspace)
	group.Delete("/:id<guid>", app.DeleteWorkspace)

}
