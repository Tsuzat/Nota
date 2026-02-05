package models

import (
	"time"

	"github.com/uptrace/bun"
)

type Session struct {
	bun.BaseModel `bun:"table:sessions"`

	Id                  string    `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
	UserId              string    `json:"user_id" bun:"user_id,type:uuid,notnull"`
	CreatedAt           time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt           time.Time `json:"updated_at" bun:"updated_at,nullzero,notnull,default:current_timestamp"`
	RefreshedAt         time.Time `json:"refreshed_at" bun:"refreshed_at"`
	UserAgent           string    `json:"user_agent" bun:"user_agent"`
	Ip                  string    `json:"ip" bun:"ip"`
	PkceChallenge       string    `json:"pkce_challenge" bun:"pkce_challenge,unique"`
	PkceChallengeMethod string    `json:"pkce_challenge_method" bun:"pkce_challenge_method"`
	State               string    `json:"state" bun:"state"`
	Browser             string    `json:"browser" bun:"browser"`
	Os                  string    `json:"os" bun:"os"`
	Device              string    `json:"device" bun:"device"`
	Country             string    `json:"country" bun:"country"`
	Revoked             bool      `json:"revoked" bun:"revoked,notnull,default:false"`
	ExpiresAt           time.Time `json:"expires_at" bun:"expires_at,notnull"`
}
