package models

import (
	"time"

	"github.com/uptrace/bun"
)

type CreateWorkspaceRequest struct {
	Icon        string `json:"icon" validate:"required,min=1,max=255"`
	Name        string `json:"name" validate:"required,min=1,max=255"`
	Description string `json:"description" validate:"omitempty,max=255"`
}

type UpdateWorkspaceRequest struct {
	Icon        string `json:"icon" validate:"required,min=1,max=255"`
	Name        string `json:"name" validate:"required,min=1,max=255"`
	Description string `json:"description" validate:"omitempty,max=255"`
}

type Workspace struct {
	bun.BaseModel `bun:"table:workspaces"`

	Id          string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Name        string    `json:"name" bun:"name"`
	Icon        string    `json:"icon" bun:"icon,default:'📁'"`
	Description string    `json:"description" bun:"description"`
	CreatedAt   time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt   time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`
	Owner       string    `json:"owner" bun:"owner,type:uuid"`
}
