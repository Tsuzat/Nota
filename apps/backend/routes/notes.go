package routes

import (
	"github.com/Tsuzat/Nota/app"
	"github.com/Tsuzat/Nota/config"
	"github.com/Tsuzat/Nota/middleware"
)

func InitNotesRouter() {
	config.APP.Get("/api/v1/db/note/preview/:id<guid>", app.GetNotePreview)
	group := config.APP.Group("/api/v1/db/note", middleware.Authenticate)
	// Get All notes by userworkspace id
	group.Get("/:id<guid>", app.GetNotes)
	group.Post("/", app.CreateNote)
	// update note by it's id
	group.Patch("/:id<guid>", app.UpdateNote)
	// delete note by it's id
	group.Delete("/:id<guid>", app.DeleteNote)
	// Get the content of the note by it's id
	group.Get("/:id<guid>/content", app.GetNoteContent)
	// Duplicate a note by it's id
	group.Post("/:id<guid>/duplicate", app.DuplicateNote)

}
