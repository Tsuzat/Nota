package models

import (
	"time"

	"github.com/uptrace/bun"
)

type Asset struct {
	bun.BaseModel `bun:"table:assets"`

	Id          string     `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	WorkspaceId string     `json:"workspace_id" bun:"workspace_id,type:uuid,notnull"`
	NoteId      *string    `json:"note_id" bun:"note_id,type:uuid"`
	Name        string     `json:"name" bun:"name,notnull"`
	Path        string     `json:"path" bun:"path,notnull"`
	MimeType    string     `json:"mime_type" bun:"mime_type,notnull"`
	Size        int64      `json:"size" bun:"size,notnull"`
	CreatedAt   time.Time  `json:"created_at" bun:"created_at,nullzero,default:current_timestamp"`
	UpdatedAt   time.Time  `json:"updated_at" bun:"updated_at,nullzero,default:current_timestamp"`
	DeletedAt   *time.Time `json:"deleted_at" bun:"deleted_at"`
}
