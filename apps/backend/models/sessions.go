package models

import (
	"time"
)

type Session struct {
	Id                  string    `json:"id" pg:"id,type:uuid"`
	UserId              string    `json:"user_id" pg:"user_id,type:uuid"`
	CreatedAt           time.Time `json:"created_at" pg:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" pg:"updated_at"`
	RefreshedAt         time.Time `json:"refreshed_at" pg:"refreshed_at"`
	UserAgent           string    `json:"user_agent" pg:"user_agent"`
	Ip                  string    `json:"ip" pg:"ip"`
	PkceChallenge       string    `json:"pkce_challenge" pg:"pkce_challenge"`
	PkceChallengeMethod string    `json:"pkce_challenge_method" pg:"pkce_challenge_method"`
	State               string    `json:"state" pg:"state"`
	Browser             string    `json:"browser" pg:"browser"`
	Os                  string    `json:"os" pg:"os"`
	Device              string    `json:"device" pg:"device"`
	Country             string    `json:"country" pg:"country"`
	Revoked             bool      `json:"revoked" pg:"revoked"`
	ExpiresAt           time.Time `json:"expires_at" pg:"expires_at"`
}
