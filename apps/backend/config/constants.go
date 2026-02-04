package config

import (
	"os"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/storage/valkey"
	"github.com/uptrace/bun"
)

// Environment variables
var DB_URL string
var ACCESS_TOKEN_SECRET string
var ACCESS_TOKEN_EXPIRY int64
var REFRESH_TOKEN_SECRET string
var REFRESH_TOKEN_EXPIRY int64
var BACKEND_URL string
var FRONTEND_URL string

// OAuth Client
var GITHUB_CLIENT_ID string
var GITHUB_CLIENT_SECRET string
var GOOGLE_CLIENT_ID string
var GOOGLE_CLIENT_SECRET string

// R2 Related
var (
	R2_ACCOUNT_ID         string
	R2_ACCESS_ID          string
	R2_SECRETE_ACCESS_KEY string
	R2_PUBLIC_ENDPOINT    string
	BUCKET_NAME           string
)

// GEMINI API Key
var GEMINI_API_KEY string

// Polar Related
var POLAR_API_KEY string
var POLAR_WEBHOOK_SECRET string
var POLAR_AI_CREDITS string
var POLAR_MONTLY_SUB string
var POLAR_YEARLY_SUB string
var POLAR_SERVER string
var POLAR_SUCCESS_URL string

// Global variables
var (
	DB  *bun.DB
	APP *fiber.App
)

// Redis Related
var (
	VALKEY_URL        string
	VALKEY_KEY_EXPIRY int
	VALKEY            *valkey.Storage
)

/*
Init function initializes the environment variables
*/
func ConstsInit() {
	DB_URL = os.Getenv("DB_URL")
	ACCESS_TOKEN_SECRET = os.Getenv("ACCESS_TOKEN_SECRET")
	ACCESS_TOKEN_EXPIRY, _ = strconv.ParseInt(os.Getenv("ACCESS_TOKEN_EXPIRY"), 10, 64)
	REFRESH_TOKEN_SECRET = os.Getenv("REFRESH_TOKEN_SECRET")
	REFRESH_TOKEN_EXPIRY, _ = strconv.ParseInt(os.Getenv("REFRESH_TOKEN_EXPIRY"), 10, 64)
	BACKEND_URL = os.Getenv("BACKEND_URL")
	FRONTEND_URL = os.Getenv("FRONTEND_URL")

	GITHUB_CLIENT_ID = os.Getenv("GITHUB_CLIENT_ID")
	GITHUB_CLIENT_SECRET = os.Getenv("GITHUB_CLIENT_SECRET")
	GOOGLE_CLIENT_ID = os.Getenv("GOOGLE_CLIENT_ID")
	GOOGLE_CLIENT_SECRET = os.Getenv("GOOGLE_CLIENT_SECRET")

	R2_ACCOUNT_ID = os.Getenv("R2_ACCOUNT_ID")
	R2_ACCESS_ID = os.Getenv("R2_ACCESS_ID")
	R2_SECRETE_ACCESS_KEY = os.Getenv("R2_SECRETE_ACCESS_KEY")
	R2_PUBLIC_ENDPOINT = os.Getenv("R2_PUBLIC_ENDPOINT")
	BUCKET_NAME = os.Getenv("BUCKET_NAME")

	GEMINI_API_KEY = os.Getenv("GEMINI_API_KEY")

	// Redis Related
	VALKEY_URL = os.Getenv("VALKEY_URL")
}
