# API Conventions and Endpoints

Base path: `/api/v1`. The version is part of the URL so a future breaking revision can ship as
`/api/v2` without redesigning application logic.

Live specification:

- Swagger UI: `GET /api/v1/docs`
- OpenAPI JSON: `GET /api/v1/openapi.json`
- Source: `apps/api/src/docs/`

## Response envelope

Single resources:

```json
{ "data": { "id": "..." } }
```

Paginated collections:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "email", "message": "Enter a valid email address", "code": "invalid_string" }
    ],
    "requestId": "c8ecb48f-9a6c-45ce-b4de-99f8504a6d7f"
  }
}
```

`details` and `requestId` are optional. Public errors never include stack traces, SQL, or database
internals. Unexpected failures are logged server-side and returned as `500 INTERNAL_ERROR`.

## Authentication

Two equivalent mechanisms are accepted:

1. The `loqta_session` HttpOnly cookie set by register/login.
2. `Authorization: Bearer <token>` with the same opaque session token.

The cookie is `SameSite=Lax`, `Path=/`, and `Secure` when `NODE_ENV=production`. Production must be
served over HTTPS. Session tokens are stored hashed; logout deletes the server-side session.

`GET /auth/sessions` lists the current user's sessions and marks the current one. Revoking the
current session clears the cookie.

## Status codes and error codes

| Code | Error code(s)                                     | Meaning                                          |
| ---- | ------------------------------------------------- | ------------------------------------------------ |
| 200  | —                                                 | Successful read or update                        |
| 201  | —                                                 | Resource created                                 |
| 202  | —                                                 | Accepted (password-reset request)                |
| 204  | —                                                 | Success with no body                             |
| 400  | `VALIDATION_ERROR`, `BAD_REQUEST`, `INVALID_JSON` | Invalid payload, token, or malformed JSON        |
| 401  | `UNAUTHORIZED`                                    | Missing, invalid, or expired session             |
| 403  | `FORBIDDEN`                                       | Authenticated but not allowed                    |
| 404  | `NOT_FOUND`                                       | Resource or route not found                      |
| 409  | `CONFLICT`                                        | Duplicate data, stock change, invalid transition |
| 429  | `RATE_LIMITED`                                    | Sensitive-endpoint rate limit exceeded           |
| 500  | `INTERNAL_ERROR`                                  | Unexpected server failure                        |

## Money

All amounts are integer cents in JSON (`priceCents`, `subtotalCents`, `totalCents`, …). Decimal
strings such as `"99.99"` are included for display. Clients must never send prices or order totals;
order totals are recalculated server-side from catalog prices.

Shipping: flat `1500` cents below a `50000` cent subtotal, free at or above the threshold. Tax is
currently `0`.

## Pagination and filtering

`page` starts at 1 and defaults to 1. `pageSize` defaults to 20 and is capped at 100.

`GET /products` supports:

| Parameter  | Values                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| `search`   | Case-insensitive name, description, or SKU substring                   |
| `category` | Category id or slug                                                    |
| `brand`    | Brand id or slug                                                       |
| `minPrice` | Decimal amount                                                         |
| `maxPrice` | Decimal amount                                                         |
| `inStock`  | `true` or `false`                                                      |
| `featured` | `true` or `false`                                                      |
| `sort`     | `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` |

Sorting is applied through a fixed allow-list; unknown values are rejected.

## Endpoints

### System

| Method | Path            | Auth   | Purpose            |
| ------ | --------------- | ------ | ------------------ |
| GET    | `/health`       | Public | Process liveness   |
| GET    | `/openapi.json` | Public | OpenAPI 3 document |
| GET    | `/docs`         | Public | Swagger UI         |

### Auth

| Method | Path                    | Auth    | Purpose                                         |
| ------ | ----------------------- | ------- | ----------------------------------------------- |
| POST   | `/auth/register`        | Public  | Create a customer and start a session           |
| POST   | `/auth/login`           | Public  | Start a session                                 |
| POST   | `/auth/logout`          | Public  | Delete the current session and clear the cookie |
| GET    | `/auth/me`              | Session | Current user                                    |
| GET    | `/auth/sessions`        | Session | List active sessions                            |
| DELETE | `/auth/sessions/{id}`   | Session | Revoke one owned session                        |
| POST   | `/auth/forgot-password` | Public  | Request a reset token                           |
| POST   | `/auth/reset-password`  | Public  | Consume a reset token and revoke all sessions   |

`register`, `login`, `forgot-password`, and `reset-password` are rate-limited. Failed attempts count
toward the limit; successful requests do not. The default is 20 failures per IP per 15-minute
window.

`forgot-password` always returns `202` and a generic message. For local development and tests only,
the response also contains `resetToken` because no email provider is configured. Production omits
it and logs the reset link through the console sender (replace the sender before real use).

### Users

| Method | Path                 | Auth    | Purpose                                 |
| ------ | -------------------- | ------- | --------------------------------------- |
| GET    | `/users/me`          | Session | Current profile                         |
| PATCH  | `/users/me`          | Session | Update full name and/or phone           |
| PUT    | `/users/me/password` | Session | Change password; revokes other sessions |

### Catalog

| Method | Path                 | Auth   | Purpose                                       |
| ------ | -------------------- | ------ | --------------------------------------------- |
| GET    | `/categories`        | Public | Active categories with active product counts  |
| GET    | `/categories/{slug}` | Public | One active category                           |
| GET    | `/brands`            | Public | Active brands with active product counts      |
| GET    | `/brands/{slug}`     | Public | One active brand                              |
| GET    | `/products`          | Public | Search, filter, sort, paginate                |
| GET    | `/products/{slug}`   | Public | Active product with images and specifications |

Inactive products, and products in inactive categories, are hidden from public endpoints. Product
images are ordered and exactly one is marked primary.

### Favorites

| Method | Path                     | Auth    | Purpose                            |
| ------ | ------------------------ | ------- | ---------------------------------- |
| GET    | `/favorites`             | Session | Paginated active favorite products |
| POST   | `/favorites/{productId}` | Session | Add favorite (idempotent)          |
| DELETE | `/favorites/{productId}` | Session | Remove favorite (idempotent)       |

### Cart

| Method | Path                   | Auth    | Purpose                                    |
| ------ | ---------------------- | ------- | ------------------------------------------ |
| GET    | `/cart`                | Session | Cart with current prices and server totals |
| DELETE | `/cart`                | Session | Remove every item                          |
| POST   | `/cart/items`          | Session | Add a product or increase quantity         |
| PATCH  | `/cart/items/{itemId}` | Session | Set quantity (1–99)                        |
| DELETE | `/cart/items/{itemId}` | Session | Remove one item                            |

Cart lines are retained if a product later becomes unavailable, but `available` becomes `false` and
the line no longer contributes to the subtotal. Checkout revalidates every line.

### Orders

| Method | Path                  | Auth    | Purpose                                  |
| ------ | --------------------- | ------- | ---------------------------------------- |
| POST   | `/orders`             | Session | Create an order from the current cart    |
| GET    | `/orders`             | Session | Current user's orders, optional `status` |
| GET    | `/orders/{id}`        | Session | One owned order                          |
| POST   | `/orders/{id}/cancel` | Session | Cancel a pending order and restore stock |

Order creation requires `shippingName`, `shippingPhone`, and `shippingAddress`. Any extra fields,
including totals, are rejected by strict validation. If stock changed since the item was added, the
request returns `409` and the transaction rolls back completely.

Order status flow:

```text
pending ──► paid ──► processing ──► shipped ──► delivered
   │          │            │
   └──────────┴────────────┴──► cancelled
```

Users may cancel only `pending` orders. Administrators use the transition endpoint for every status
change. Cancellation restores stock exactly once.

### Admin

All admin routes require the `Admin` role.

| Method | Path                        | Purpose                                              |
| ------ | --------------------------- | ---------------------------------------------------- |
| GET    | `/admin/stats`              | Users, products, categories, brands, orders, revenue |
| GET    | `/admin/users`              | Paginated users, optional search                     |
| PATCH  | `/admin/users/{id}/role`    | Promote/demote; cannot change own role               |
| GET    | `/admin/categories`         | All categories, including inactive                   |
| POST   | `/admin/categories`         | Create category                                      |
| PATCH  | `/admin/categories/{id}`    | Update category                                      |
| DELETE | `/admin/categories/{id}`    | Delete if it has no products                         |
| GET    | `/admin/brands`             | All brands, including inactive                       |
| POST   | `/admin/brands`             | Create brand                                         |
| PATCH  | `/admin/brands/{id}`        | Update brand                                         |
| DELETE | `/admin/brands/{id}`        | Delete if it has no products                         |
| GET    | `/admin/products`           | All products, including inactive                     |
| GET    | `/admin/products/{id}`      | Any product by id                                    |
| POST   | `/admin/products`           | Create product and optional images                   |
| PATCH  | `/admin/products/{id}`      | Update product; images replace the old set           |
| DELETE | `/admin/products/{id}`      | Soft-delete (deactivate) a product                   |
| GET    | `/admin/orders`             | All orders, filter by status/user/search             |
| GET    | `/admin/orders/{id}`        | Any order                                            |
| PATCH  | `/admin/orders/{id}/status` | Apply a valid status transition                      |

Revenue counts orders in `paid`, `processing`, `shipped`, or `delivered`; pending and cancelled
orders are excluded. Low stock means active products with five or fewer units.

## Example: customer checkout

```bash
# 1. Log in and keep the cookie
curl.exe -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"user@loqta.dev","password":"User123!"}' \
  http://localhost:3000/api/v1/auth/login

# 2. Add a product (use a real id from GET /products)
curl.exe -b cookies.txt -H "Content-Type: application/json" \
  -d '{"productId":"<product-id>","quantity":1}' \
  http://localhost:3000/api/v1/cart/items

# 3. Check out
curl.exe -b cookies.txt -H "Content-Type: application/json" \
  -d '{"shippingName":"Demo Customer","shippingPhone":"+1 555 010 2000","shippingAddress":"123 Demo Street, Demo City"}' \
  http://localhost:3000/api/v1/orders
```

API clients that do not store cookies can pass `Authorization: Bearer <token>`; the token is the
cookie value returned in `Set-Cookie` at login.

## Documentation maintenance

`apps/api/src/docs/schemas.ts`, `paths.ts`, and `openapi.ts` are the machine-readable source of
truth. Update them whenever a route, payload, or error response changes. The integration suite
checks that every expected path exists and that no schema `$ref` is dangling.
