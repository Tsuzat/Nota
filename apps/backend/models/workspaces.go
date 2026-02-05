package models

import (
	"time"

	"github.com/uptrace/bun"
)

type UserWorkspace struct {
	bun.BaseModel `bun:"table:userworkspaces"`

	Id        string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Icon      string    `json:"icon" bun:"icon,notnull"`
	Name      string    `json:"name" bun:"name"`
	Owner     string    `json:"owner" bun:"owner,type:uuid"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}

type Workspace struct {
	bun.BaseModel `bun:"table:workspaces"`

	Id            string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	Name          string    `json:"name" bun:"name"`
	Icon          string    `json:"icon" bun:"icon,default:'📁'"`
	Description   string    `json:"description" bun:"description"`
	CreatedAt     time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt     time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`
	Owner         string    `json:"owner" bun:"owner,type:uuid"`
	UserWorkspace string    `json:"userworkspace" bun:"userworkspace,type:uuid"`
}
