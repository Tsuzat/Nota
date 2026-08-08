package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func CollabRouteInit() {
	group := config.APP.Group("/api/v1/collab", middleware.CollabAuth)

	// Access check — called by Hocuspocus onAuthenticate
	group.Get("/notes/:noteId", app.CheckNoteAccess)

	// YDoc state — called by Hocuspocus onLoadDocument / onStoreDocument
	group.Get("/notes/:noteId/ydoc", app.LoadYDoc)
	group.Put("/notes/:noteId/ydoc", app.StoreYDoc)
}
