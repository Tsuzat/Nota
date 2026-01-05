# Nota Audit Report

**Date:** 3 January 2026
**Version:** 1.0.0
**Status:** Pre-Release Audit

## 1. Executive Summary

The **Nota** monorepo is in a strong pre-release state, featuring a modern architecture (Svelte 5, Tauri v2, Hono) and a robust feature set (Local-first + Cloud sync, AI integration). However, critical security and stability gaps regarding **Desktop App Monitoring** and **Deep Link Authentication** must be addressed before the first public release.

## 2. Security Audit

### 🔴 Critical Concerns

1.  **Deep Link Authentication Exposure (`apps/desktop`)**
    *   **Issue:** The desktop app authenticates via deep links (`nota://auth/callback`) where access and refresh tokens are passed directly in the URL parameters.
    *   **Risk:** On some platforms, these URLs can be logged by the OS or intercepted by other applications registered to the same protocol, potentially leaking long-lived user credentials.
    *   **Recommendation:** Implement PKCE (Proof Key for Code Exchange) or use a short-lived one-time authorization code that the desktop app exchanges for tokens via a direct POST request.

2.  **In-Memory IP Banning (`apps/backend`)**
    *   **Issue:** The `banMiddleware` uses an in-memory `Map` to track suspicious IPs.
    *   **Risk:** This data is lost on server restart and does not scale if multiple backend instances are deployed (e.g., horizontal scaling). Attackers can simply rotate IPs or wait for a deployment to resume attacks.
    *   **Recommendation:** Migrate banned IP storage to Redis (already used for caching) with a set TTL.

### 🟡 Warnings

1.  **S3/R2 Presigned URL Scope**
    *   **Observation:** The system generates presigned URLs for uploads.
    *   **Recommendation:** Ensure strict validation of the `contentType` and `size` parameters *before* generating the URL to prevent users from uploading disallowed file types or massive files that bypass application logic.

## 3. Architecture & Code Quality

### ✅ Strengths
*   **Modern State Management:** Consistent use of Svelte 5 Runes (`$state`, `$derived`, `$effect`) simplifies reactivity.
*   **Shared Logic:** Good separation of concerns with `@nota/client` and `@nota/ui` packages.
*   **Performance:** Use of `drizzle-orm` with efficient queries and Redis caching for file listings.

### ⚠️ Areas for Improvement
*   **Desktop Crash Reporting:**
    *   **Issue:** While `@apps/backend` and `@apps/web` have Sentry integration, **`@apps/desktop` lacks crash reporting**. Errors in `+layout.svelte` are currently just logged to `console.error`.
    *   **Fix:** Integrate `@sentry/sveltekit` (or `@sentry/browser`) into the desktop app to track client-side errors in production.
*   **Error Handling Consistency:**
    *   The `@nota/client` package often throws generic errors. Standardizing on a custom `NotaError` class would improve debugging and UI feedback.

## 4. Release Readiness Checklist

| Category | Item | Status | Action Required |
| :--- | :--- | :--- | :--- |
| **Stability** | **Crash Reporting (Desktop)** | ❌ Missing | Add Sentry to Desktop App. |
| **Security** | **Deep Link Auth** | ⚠️ Risky | Review/Harden protocol handling. |
| **Security** | **Rate Limiting** | ✅ Good | In-memory is acceptable for v1, move to Redis for v2. |
| **Features** | **Tauri Updater** | ✅ Ready | Logic present in `+layout.svelte`. |
| **Features** | **Payments** | ✅ Ready | Dodopayments integration verified. |
| **Legal** | **License** | ⚠️ Custom | Custom License may confuse users; clarify or accept "Source Available" status. |

## 5. Immediate Next Steps

1.  **Install Sentry** in `@apps/desktop`.
2.  **Refactor Ban Middleware** to use Redis if possible, or document the limitation.
3.  **Harden Deep Link Flow** to verify a `state` parameter at minimum to prevent CSRF-like attacks.
4.  **Run Full E2E Tests**: Verify the "Offline -> Online" sync flow manually, as automated tests for this specific behavior were not seen.
