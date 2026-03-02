# Nota Backend

The Go-based REST API server powering **Nota** — handling authentication, note management, workspaces, payments, file storage, and AI features.

## 🛠️ Tech Stack

| Layer              | Technology                                                                         |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Language**       | [Go 1.25](https://go.dev/)                                                         |
| **Framework**      | [Fiber v3](https://gofiber.io/)                                                    |
| **Database**       | [PostgreSQL](https://www.postgresql.org/) via [Bun ORM](https://bun.uptrace.dev/)  |
| **Cache**          | [Valkey](https://valkey.io/) (Redis-compatible)                                    |
| **Object Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible) |
| **Auth**           | JWT (Access + Refresh tokens), OAuth 2.0 (GitHub, Google)                          |
| **AI**             | [Google Gemini](https://ai.google.dev/)                                            |
| **Payments**       | [Polar](https://polar.sh/)                                                         |
| **Validation**     | [go-playground/validator](https://github.com/go-playground/validator)              |
| **Monitoring**     | [Sentry](https://sentry.io/)                                                       |

## 📂 Project Structure

```
apps/backend/
├── main.go              # Entry point — initializes DB, Valkey, S3, Fiber app
├── app/                 # Business logic / handlers
│   ├── ai.go            # AI text generation (Gemini)
│   ├── auth.go          # Signup, login, OAuth, email verification, password reset
│   ├── notes.go         # CRUD operations for notes
│   ├── payments.go      # Subscription & credit management (Polar)
│   ├── promotions.go    # Promotional redemptions
│   ├── sessions.go      # Session listing & revocation
│   ├── storage.go       # File upload/download/delete (R2)
│   ├── user.go          # User profile operations
│   ├── userworkspace.go # User ↔ Workspace membership
│   └── workspace.go     # Workspace CRUD
├── config/
│   └── constants.go     # Global config, env vars, app-wide singletons
├── db/
│   ├── pg.go            # PostgreSQL connection
│   ├── valkey.go        # Valkey connection
│   ├── sessions.go      # Session DB helpers
│   └── user.go          # User DB helpers
├── middleware/
│   ├── auth.go          # JWT authentication middleware
│   ├── ban.go           # IP/user ban enforcement
│   ├── checkpro.go      # Pro subscription verification
│   ├── logger.go        # Request logging
│   └── security.go      # Input sanitization
├── models/
│   ├── user.go          # User model & related structs
│   ├── notes.go         # Note model
│   ├── workspaces.go    # Workspace model
│   ├── sessions.go      # Session model
│   ├── auth.go          # Auth request/response DTOs
│   ├── oauth.go         # OAuth state & token structs
│   └── response.go      # Standardized API response wrapper
├── routes/
│   ├── main.go          # Route initialization & health check
│   ├── auth.go          # /api/v1/auth/*
│   ├── notes.go         # /api/v1/notes/*
│   ├── workspace.go     # /api/v1/workspace/*
│   ├── userworkspace.go # /api/v1/userworkspace/*
│   ├── payments.go      # /api/v1/payments/*
│   ├── storage.go       # /api/v1/storage/*
│   ├── sessions.go      # /api/v1/sessions/*
│   ├── ai.go            # /api/v1/ai/*
│   └── user.go          # /api/v1/user/*
├── utils/
│   ├── cache.go         # Valkey cache helpers
│   ├── oauth.go         # OAuth flow utilities
│   └── storage.go       # S3/R2 client initialization
├── test/                # Unit tests for handlers
├── testutils/           # Shared test helpers & mocks
├── Dockerfile           # Multi-stage Docker build
├── .env.example         # Environment variable template
├── go.mod
└── go.sum
```

## ⚡ Getting Started

### Prerequisites

- [Go 1.25+](https://go.dev/dl/)
- [PostgreSQL](https://www.postgresql.org/) instance
- [Valkey](https://valkey.io/) (or Redis-compatible) instance
- S3-compatible object storage (e.g. Cloudflare R2)

### Environment Setup

```bash
cp .env.example .env
```

Fill in the required values in `.env`:

| Variable                 | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `DB_URL`                 | PostgreSQL connection string                    |
| `VALKEY_URL`             | Valkey/Redis connection URL                     |
| `ACCESS_TOKEN_SECRET`    | JWT signing secret for access tokens            |
| `REFRESH_TOKEN_SECRET`   | JWT signing secret for refresh tokens           |
| `ACCESS_TOKEN_EXPIRY`    | Access token expiry in minutes (default: `30`)  |
| `REFRESH_TOKEN_EXPIRY`   | Refresh token expiry in days (default: `7`)     |
| `BACKEND_URL`            | Backend URL (default: `http://127.0.0.1:3000`)  |
| `FRONTEND_URL`           | Frontend URL (default: `http://127.0.0.1:5173`) |
| `GITHUB_CLIENT_ID`       | GitHub OAuth App Client ID                      |
| `GITHUB_CLIENT_SECRET`   | GitHub OAuth App Client Secret                  |
| `GOOGLE_CLIENT_ID`       | Google OAuth Client ID                          |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth Client Secret                      |
| `R2_ACCOUNT_ID`          | Cloudflare R2 Account ID                        |
| `R2_ACCESS_ID`           | R2 Access Key ID                                |
| `R2_SECRETE_ACCESS_KEY`  | R2 Secret Access Key                            |
| `R2_PUBLIC_ENDPOINT`     | R2 public bucket endpoint                       |
| `BUCKET_NAME`            | R2 bucket name                                  |
| `GEMINI_API_KEY`         | Google Gemini API key                           |
| `POLAR_API_KEY`          | Polar API key                                   |
| `POLAR_WEBHOOK_SECRET`   | Polar webhook signing secret                    |
| `SENTRY_DSN`             | Sentry DSN for error tracking                   |
| `DESKTOP_APP_IDENTIFIER` | Identifier for desktop app requests             |
| `COOKIE_DOMAIN`          | Domain for auth cookies                         |

### Running Locally

```bash
go run main.go
```

The server starts on **port 3000** by default.

### Running Tests

```bash
go test ./...
```

## 🐳 Docker

### Build

```bash
docker build -t nota-backend .
```

### Run

```bash
docker run -p 3000:3000 --env-file .env nota-backend
```

The Dockerfile uses a **multi-stage build** (build on `golang:1.25-alpine`, run on `alpine:latest` with `dumb-init`) to produce a minimal, production-ready image.

## 🔑 API Overview

All API routes are prefixed with `/api/v1/`. Desktop clients send an `X-Nota-Desktop-Identifier` header for identification.

| Endpoint Group      | Base Path                 | Description                                        |
| ------------------- | ------------------------- | -------------------------------------------------- |
| **Health**          | `/api/v1/healthcheck`     | Server health check                                |
| **Auth**            | `/api/v1/auth/*`          | Signup, login, OAuth, verification, password reset |
| **Sessions**        | `/api/v1/sessions/*`      | List & revoke active sessions                      |
| **User**            | `/api/v1/user/*`          | Profile management                                 |
| **Workspaces**      | `/api/v1/workspace/*`     | Workspace CRUD                                     |
| **User Workspaces** | `/api/v1/userworkspace/*` | User ↔ Workspace membership                        |
| **Notes**           | `/api/v1/notes/*`         | Note CRUD operations                               |
| **Storage**         | `/api/v1/storage/*`       | File upload, download, delete                      |
| **Payments**        | `/api/v1/payments/*`      | Subscriptions & credit management                  |
| **AI**              | `/api/v1/ai/*`            | AI text generation                                 |

## 🔒 Middleware Stack

Requests pass through these middleware layers (in order):

1. **Request Logger** — Logs method, path, status, and latency
2. **Sanitization** — Sanitizes request inputs
3. **Ban Enforcement** — Blocks banned IPs/users
4. **CORS** — Restricts origins to `nota.ink` domains
5. **Rate Limiter** — Sliding window limit (100 req/min) backed by Valkey
6. **Authentication** — JWT verification (applied per-route)
