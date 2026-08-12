package models

import (
	"time"

	"github.com/uptrace/bun"
)

type NoteVersion struct {
	bun.BaseModel `bun:"table:note_versions"`

	Id                  string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	NoteId              string    `json:"note_id" bun:"note_id,type:uuid,notnull"`
	WorkspaceId         string    `json:"workspace_id" bun:"workspace_id,type:uuid,notnull"`
	ContentCompressed   []byte    `json:"-" bun:"content_compressed,notnull"`
	ContentHash         string    `json:"content_hash" bun:"content_hash,notnull"`
	SizeBytes           int       `json:"size_bytes" bun:"size_bytes,notnull"`
	CompressedSizeBytes int       `json:"compressed_size_bytes" bun:"compressed_size_bytes,notnull"`
	VersionType         string    `json:"version_type" bun:"version_type,notnull,default:'auto'"`
	Label               *string   `json:"label" bun:"label"`
	CreatedBy           *string   `json:"created_by" bun:"created_by,type:uuid"`
	CreatedAt           time.Time `json:"created_at" bun:"created_at,notnull,default:now()"`
}

type CreateManualSnapshotRequest struct {
	Label *string `json:"label" validate:"omitempty,max=255"`
}

type RestoreFromContentRequest struct {
	Content       map[string]any `json:"content" validate:"required"`
	RestoreUpdate string         `json:"restore_update" validate:"required"`
	Label         *string        `json:"label" validate:"omitempty,max=255"`
}

type NoteVersionListItem struct {
	Id                  string    `json:"id"`
	NoteId              string    `json:"note_id"`
	WorkspaceId         string    `json:"workspace_id"`
	ContentHash         string    `json:"content_hash"`
	SizeBytes           int       `json:"size_bytes"`
	CompressedSizeBytes int       `json:"compressed_size_bytes"`
	VersionType         string    `json:"version_type"`
	Label               *string   `json:"label"`
	CreatedBy           *string   `json:"created_by"`
	CreatedAt           time.Time `json:"created_at"`
}

type LatestVersionMeta struct {
	ContentHash string    `json:"content_hash"`
	VersionType string    `json:"version_type"`
	CreatedAt   time.Time `json:"created_at"`
}
