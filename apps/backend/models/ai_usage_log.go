package models

import (
	"time"

	"github.com/uptrace/bun"
)

type AiUsageLog struct {
	bun.BaseModel `bun:"table:ai_usage_logs"`

	Id           string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	UserId       string    `json:"user_id" bun:"user_id,notnull,type:uuid"`
	NoteId       string    `json:"note_id" bun:"note_id,notnull,type:uuid"`
	InputTokens  int       `json:"input_tokens" bun:"input_tokens,notnull,default:0"`
	OutputTokens int       `json:"output_tokens" bun:"output_tokens,notnull,default:0"`
	CostCents    float64   `json:"cost_cents" bun:"cost_cents,notnull,default:0"`
	Description  string    `json:"description" bun:"description"`
	CreatedAt    time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
}

type AiUsageLogResponse struct {
	Id          string    `json:"id" bun:"id"`
	CostCents   float64   `json:"usages" bun:"cost_cents"`
	NoteId      string    `json:"note_id" bun:"note_id"`
	NoteName    string    `json:"note_name" bun:"note_name"`
	Description string    `json:"description" bun:"description"`
	CreatedAt   time.Time `json:"on" bun:"created_at"`
}
