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
