# API Conventions

Base path: `/api/v1`. The version is part of the URL so a future breaking revision can ship as
`/api/v2` without redesigning the application logic.

## Response envelope

Successful responses:

```json
{ "data": {} }
```

List responses will use:

```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }
```

Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": {}
  }
}
```

`details` is optional. Public error responses never include stack traces, SQL, or database
internals. Unexpected errors are logged server-side and returned as `500 INTERNAL_ERROR`.

## Status codes

| Code | Meaning                                                |
| ---- | ------------------------------------------------------ |
| 200  | Successful read or update                              |
| 201  | Resource created                                       |
| 204  | Successful request with no response body               |
| 400  | Malformed request or validation failure                |
| 401  | Missing or invalid authentication                      |
| 403  | Authenticated but not allowed (for example, non-admin) |
| 404  | Resource or route not found                            |
| 409  | Conflict (duplicate email, stock changed, etc.)        |
| 422  | Semantically invalid business request                  |
| 429  | Rate limit exceeded                                    |
| 500  | Unexpected server error                                |

## Implemented endpoints

| Method | Path             | Auth   | Description                               |
| ------ | ---------------- | ------ | ----------------------------------------- |
| GET    | `/api/v1/health` | Public | Liveness check: status, uptime, timestamp |

Business endpoints (`/auth`, `/users`, `/categories`, `/brands`, `/products`, `/favorites`,
`/cart`, `/orders`, and admin routes) are added in Phases 3–6. Each will be documented in the
OpenAPI document at `apps/api/src/docs/openapi.ts` and served through Swagger UI in Phase 6.

## Documentation format

OpenAPI schemas live in `apps/api/src/docs/schemas/`. The document must describe request
parameters, request bodies, response schemas, error responses, and authentication requirements.
This directory holds human-readable API notes; the generated specification is the source of truth
once Phase 6 is implemented.
