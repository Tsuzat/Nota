package models

import (
	"time"

	"github.com/uptrace/bun"
)

// NoteCollaborator maps to the "note_collaborators" table
type NoteCollaborator struct {
	bun.BaseModel `bun:"table:note_collaborators"`

	Id        string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	NoteId    string    `json:"note_id" bun:"note_id,type:uuid,notnull"`
	UserId    string    `json:"user_id" bun:"user_id,type:uuid,notnull"`
	Role      string    `json:"role" bun:"role,notnull"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,nullzero,default:current_timestamp"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,nullzero,default:current_timestamp"`
}

// CollabAccessResponse is the JSON payload returned to the collaboration server.
// It is validated with Zod on the TypeScript side.
type CollabAccessResponse struct {
	UserId     string `json:"user_id"`
	UserName   string `json:"user_name"`
	UserAvatar string `json:"user_avatar"`
	Role       string `json:"role"`
	ReadOnly   bool   `json:"read_only"`
}

// CollaboratorResponse is the DTO returned when listing collaborators
type CollaboratorResponse struct {
	Id        string    `json:"id"`
	NoteId    string    `json:"note_id"`
	UserId    string    `json:"user_id"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	// User Info
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarUrl string    `json:"avatar_url"`
}
