package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitVersionRoutes() {
	group := config.APP.Group("/api/v1/db/note", middleware.Authenticate, middleware.CheckPro)
	
	// Workspace-scoped list
	group.Get("/workspace/:workspaceId<guid>/versions", app.ListWorkspaceVersions)
	
	// Note-scoped endpoints
	group.Get("/:id<guid>/versions/count", app.GetNoteVersionCount)
	group.Get("/:id<guid>/versions/:versionId<guid>", app.GetNoteVersion)
	group.Post("/:id<guid>/versions", app.CreateManualSnapshot)
	group.Delete("/:id<guid>/versions/:versionId<guid>", app.DeleteNoteVersion)
	group.Post("/:id<guid>/versions/:versionId<guid>/restore", app.RestoreNoteVersion)
	group.Post("/:id<guid>/restore-from-content", app.RestoreNoteFromContent)
}
