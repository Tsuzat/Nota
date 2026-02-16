package models

import (
	"time"

	"github.com/uptrace/bun"
)

type Note struct {
	bun.BaseModel `bun:"table:notes"`

	Id            string         `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Name          string         `json:"name" bun:"name,notnull"`
	Icon          string         `json:"icon" bun:"icon,notnull,default:'📝'"`
	Workspace     string         `json:"workspace" bun:"workspace,type:uuid,notnull"`
	UserWorkspace string         `json:"userworkspace" bun:"userworkspace,type:uuid,notnull"`
	Owner         string         `json:"owner" bun:"owner,type:uuid,notnull"`
	Favorite      bool           `json:"favorite" bun:"favorite,notnull,default:false"`
	Trashed       bool           `json:"trashed" bun:"trashed,notnull,default:false"`
	CreatedAt     time.Time      `json:"created_at" bun:"created_at,nullzero,default:current_timestamp"`
	UpdatedAt     time.Time      `json:"updated_at" bun:"updated_at,nullzero,default:current_timestamp"`
	IsPublic      bool           `json:"is_public" bun:"is_public,default:false"`
	Content       map[string]any `json:"content" bun:"content,type:jsonb,default:'{}'"`
}

type CreateNoteRequest struct {
	Name          string `json:"name" validate:"required,min=1,max=255"`
	Icon          string `json:"icon" validate:"required,min=1,max=512"`
	Workspace     string `json:"workspace" validate:"required,uuid"`
	UserWorkspace string `json:"userworkspace" validate:"required,uuid"`
	Favorite      bool   `json:"favorite" validate:"boolean"`
}

type UpdateNoteRequest struct {
	Name      *string `json:"name" validate:"omitempty,max=255"`
	Icon      *string `json:"icon" validate:"omitempty,max=512"`
	Favorite  *bool   `json:"favorite" validate:"omitempty,boolean"`
	IsPublic  *bool   `json:"is_public" validate:"omitempty,boolean"`
	Trashed   *bool   `json:"trashed" validate:"omitempty,boolean"`
	Workspace *string `json:"workspace" validate:"omitempty,uuid"`
}

type ImportNoteRequest struct {
	Name          string         `json:"name" validate:"required,min=1,max=255"`
	Workspace     string         `json:"workspace" validate:"required,uuid"`
	UserWorkspace string         `json:"userworkspace" validate:"required,uuid"`
	Content       map[string]any `json:"content" validate:"required,json"`
}

type NotePatchOperation struct {
	Op    string `json:"op" validate:"required,oneof=add replace remove"`
	Path  string `json:"path" validate:"required"`
	Value any    `json:"value" validate:"omitempty"`
}
