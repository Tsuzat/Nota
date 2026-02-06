package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitNotesRouter() {
	group := config.APP.Group("/api/v1/db/note", middleware.Authenticate)

	group.Get("/:id<guid>", app.GetNotes)
	group.Post("/", app.CreateNote)
	group.Patch("/:id<guid>", app.UpdateNote)
}
