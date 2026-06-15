package models

import (
	"time"

	"github.com/uptrace/bun"
)

type Note struct {
	bun.BaseModel `bun:"table:notes"`

	Id           string         `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Name         string         `json:"name" bun:"name,notnull"`
	Icon         string         `json:"icon" bun:"icon,notnull,default:'📝'"`
	WorkspaceId  string         `json:"workspace_id" bun:"workspace_id,type:uuid,notnull"`
	ParentNoteId *string        `json:"parent_note_id" bun:"parent_note_id,type:uuid"`
	Owner        string         `json:"owner" bun:"owner,type:uuid,notnull"`
	Pinned       bool           `json:"pinned" bun:"pinned,notnull,default:false"`
	DeletedAt    *time.Time     `json:"deleted_at" bun:"deleted_at"`
	CreatedAt    time.Time      `json:"created_at" bun:"created_at,nullzero,default:current_timestamp"`
	UpdatedAt    time.Time      `json:"updated_at" bun:"updated_at,nullzero,default:current_timestamp"`
	IsPublic     bool           `json:"is_public" bun:"is_public,default:false"`
	Content      map[string]any `json:"content" bun:"content,type:jsonb,default:'{}'"`
}

type CreateNoteRequest struct {
	Name         string  `json:"name" validate:"required,min=1,max=255"`
	Icon         string  `json:"icon" validate:"required,min=1,max=512"`
	WorkspaceId  string  `json:"workspace_id" validate:"required,uuid"`
	ParentNoteId *string `json:"parent_note_id" validate:"omitempty,uuid"`
	Pinned       bool    `json:"pinned" validate:"boolean"`
}

type UpdateNoteRequest struct {
	Name         *string    `json:"name" validate:"omitempty,max=255"`
	Icon         *string    `json:"icon" validate:"omitempty,max=512"`
	Pinned       *bool      `json:"pinned" validate:"omitempty,boolean"`
	IsPublic     *bool      `json:"is_public" validate:"omitempty,boolean"`
	DeletedAt    *time.Time `json:"deleted_at" validate:"omitempty"`
	WorkspaceId  *string    `json:"workspace_id" validate:"omitempty,uuid"`
	ParentNoteId *string    `json:"parent_note_id" validate:"omitempty,uuid"`
}

type ImportNoteRequest struct {
	Name         string         `json:"name" validate:"required,min=1,max=255"`
	WorkspaceId  string         `json:"workspace_id" validate:"required,uuid"`
	ParentNoteId *string        `json:"parent_note_id" validate:"omitempty,uuid"`
	Content      map[string]any `json:"content" validate:"required,json"`
}

type NotePatchOperation struct {
	Op    string `json:"op" validate:"required,oneof=add replace remove"`
	Path  string `json:"path" validate:"required"`
	Value any    `json:"value" validate:"omitempty"`
}
