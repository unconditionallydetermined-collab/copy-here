# CareerSync Comprehensive Debugging & Diagnostics Guide

This document explains how to activate, use, and interpret the full-stack debug logging infrastructure in CareerSync.

---

## 1. How to Turn on the `/debug` Page

The frontend includes a built-in diagnostics console at `/debug`. It provides real-time in-memory event streaming, search, filtering by level/area, full JSON inspection, one-click export, and Supabase database synchronization.

### Access Control
The `/debug` route is protected and is enabled if either condition is met:
1. **Direct Flag**: `VITE_DEBUG=true` in your environment (recommended for local development).
2. **Admin Email Whitelist**: The signed-in user's email is present in `VITE_DEBUG_ADMINS` (comma-separated list, e.g. `user@example.com,admin@company.com`).

When enabled, a **Debug Console** navigation link automatically appears in the sidebar for authorized users.

---

## 2. Environment Variables Reference

| Variable | Scope | Description | Sensitive? |
| :--- | :--- | :--- | :--- |
| `VITE_DEBUG` | Frontend | Set to `true` to enable the `/debug` dashboard for any logged-in user. | No |
| `VITE_DEBUG_ADMINS` | Frontend & Backend | Comma-separated list of admin email addresses authorized to access `/debug` and `/api/v1/debug/health`. | No |
| `LOG_LEVEL` | Backend | Configures SLF4J / Logback logging level (e.g. `DEBUG`, `INFO`, `WARN`, `ERROR`). Defaults to `INFO`. | No |
| `CORS_ALLOWED_ORIGINS` | Backend | Comma-separated list of allowed frontend origins (logged at startup). | No |
| `SUPABASE_URL` | Frontend & Backend | Supabase instance URL. Only hostname is logged. | No |
| `SUPABASE_ANON_KEY` | Frontend & Backend | Supabase anonymous public key. | **Never logged** |
| `SUPABASE_JWT_SECRET`| Backend | Supabase JWT secret for HMAC signature verification. | **Never logged** |

---

## 3. How to Query the `debug_logs` Supabase Table

All client-side logs are batched (up to 25 records at a time) and dispatched asynchronously to the Supabase `debug_logs` table without blocking UI interactions or failing network requests.

### Schema:
- `id` (uuid, primary key)
- `created_at` (timestamptz with descending index)
- `level` (text: `DEBUG`, `INFO`, `WARN`, `ERROR`)
- `area` (text: e.g. `API`, `Auth`, `ResumeUpload`, `AI`, `Navigation`, `GitHub`)
- `message` (text: descriptive summary, emails masked as `a***@domain.com`)
- `details` (jsonb: request ID, response payload, timing in ms, error stacks)
- `user_id` (uuid: authenticated user ID)
- `session_id` (text: client session identifier)
- `route` (text: current browser pathname)
- `user_agent` (text: browser user agent string)

### Useful SQL Queries in Supabase SQL Editor:

#### View the latest 50 errors:
```sql
SELECT created_at, area, message, details->>'errorMessage' AS error, details->>'status' AS http_status, route
FROM debug_logs
WHERE level = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

#### Diagnose failed resume uploads or "Failed to fetch":
```sql
SELECT created_at, message, details->>'status' AS status, details->>'durationMs' AS duration_ms, details
FROM debug_logs
WHERE area IN ('ResumeUpload', 'API')
  AND level = 'error'
ORDER BY created_at DESC
LIMIT 20;
```

#### Find all logs for a specific request ID:
```sql
SELECT created_at, level, area, message, details
FROM debug_logs
WHERE details->>'requestId' = 'your-request-id-here'
ORDER BY created_at ASC;
```

#### Grant debug viewing permissions to an admin:
```sql
INSERT INTO public.debug_admins (email)
VALUES ('admin@example.com')
ON CONFLICT (email) DO NOTHING;
```

#### Manually run the 14-day log retention cleanup:
```sql
SELECT public.cleanup_old_debug_logs();
```

---

## 4. Backend Health Endpoint: `/api/v1/debug/health`

The backend provides an admin-only health and diagnostics endpoint:
- **URL**: `GET /api/v1/debug/health`
- **Headers**: `Authorization: Bearer <SUPABASE_JWT>`
- **Response**:
```json
{
  "appVersion": "1.0.0",
  "uptimeSeconds": 1420,
  "jvmUptimeMs": 1420512,
  "database": {
    "connected": true
  },
  "environmentVariablesSet": {
    "MONGODB_URI": true,
    "SUPABASE_URL": true,
    "SUPABASE_ANON_KEY": true,
    "SUPABASE_JWT_SECRET": true,
    "GEMINI_API_KEY": true,
    "CORS_ALLOWED_ORIGINS": true,
    "DEBUG_ADMINS": true
  }
}
```

---

## 5. How to Read Backend Logs on Render

When deployed to Render:
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Select your `career-sync-backend` service.
3. Click on the **Logs** tab in the left navigation sidebar.
4. Filter or search logs by:
   - **`HTTP`**: Shows every incoming request with `method`, `path`, `status`, `duration=...ms`, and `userId`.
   - **`[<requestId>]`**: Correlate a frontend error with the exact backend trace using the `X-Request-Id` UUID header.
   - **`JWT validation`**: View token verification attempts (`VALID` vs `INVALID` and method used).
   - **`Resume upload`**: Track step-by-step file receipt, memory extraction characters, skills identified, and MongoDB save result.
   - **`CORS configuration initialized`**: Inspect the allowed origins printed during startup.
