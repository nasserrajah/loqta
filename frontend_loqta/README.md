# Loqta — Professional Electronics E-Commerce Frontend

A production-quality React + TypeScript storefront for **Loqta | لُقطة**, featuring interactive **3D product inspection** (React Three Fiber), Arabic/English RTL support, live backend integration, and an eight-product 3D demo catalog.

> **Portfolio badge:** the demo catalog is reference data for presentation. When the backend serves real products, the app shows real API data instead and stops displaying "Demo Data" badges.

---

## Tech Stack

| Area            | Technology                                      |
| --------------- | ----------------------------------------------- |
| UI              | React 18, TypeScript, Tailwind CSS              |
| Routing         | React Router v6                                 |
| API             | Axios (central `src/services/api.ts`)           |
| 3D              | Three.js, React Three Fiber, React Three Drei   |
| State           | Zustand (persisted cart/favorites/language)     |
| Forms           | React Hook Form + Zod                           |
| Icons           | Lucide React                                    |
| Tests           | Vitest + React Testing Library                  |
| Build           | Vite 5                                          |

---

## Getting Started

```bash
# 1. install dependencies
npm install

# 2. configure the backend URL
cp .env.example .env        # Windows: copy .env.example .env
# then edit .env if needed

# 3. run the dev server
npm run dev                 # http://localhost:5173

# 4. production build + preview
npm run build
npm run preview

# 5. run tests
npm test
```

## Backend Configuration

The backend runs on Render and is **not part of this project**. Every request goes
through one central module:

```
frontend_loqta/src/services/api.ts
```

- Base URL comes **only** from `VITE_API_BASE_URL` (see `.env.example`)
- Default: `https://loqta-feto.onrender.com/api/v1`
- Endpoints used (all verified against the live API):

| Feature         | Endpoint                                            | Auth                 |
| --------------- | --------------------------------------------------- | -------------------- |
| Products        | `GET /products`, `GET /products/:slug`               | public               |
| Categories      | `GET /categories`                                    | public               |
| Register/Login  | `POST /auth/register`, `POST /auth/login`            | public               |
| Session         | `GET /auth/me`, `POST /auth/logout`                  | cookie or Bearer     |
| Password reset  | `POST /auth/forgot-password`                         | public               |
| Profile         | `GET /users/me`, `PATCH /users/me`                   | session              |
| Favorites       | `GET/POST/DELETE /favorites[/:productId]`            | session              |
| Cart            | `GET/DELETE /cart`, `POST/PATCH/DELETE /cart/items`  | session              |

**Auth strategy:** login sets an HttpOnly session cookie (`SameSite=None; Secure`
in production) **and** returns an opaque session token in the response body.
The frontend prefers the `Authorization: Bearer <token>` header so auth works
even when third-party cookies are blocked. The token is kept in `localStorage`
— it is a session token, **no passwords or secrets are ever stored**.

### CORS requirements (backend side)

Cross-origin credentialed requests need the backend to:

1. echo the exact `Origin` (a wildcard `*` header is rejected by browsers when
   credentials are used),
2. answer the `OPTIONS` preflight and allow `Authorization` headers,
3. `Access-Control-Allow-Credentials: true` (only needed for the cookie path).

The deployed backend already supports this.

### Demo fallback behavior

If the API is unreachable or returns no products, the storefront shows the
**eight reference demo products** (client-side search/filter still work) with a
clear "Demo mode" notice. Nothing is fabricated about availability, prices
beyond the sample values, or backend state.

Only products that have a real 3D model are listed, so every card the user opens
can be inspected in 3D. Backend catalog names are matched to the bundled models
in `src/data/modelRegistry.ts`; other products stay hidden.

---

## 3D Assets — Licensing

Each product model is a local GLTF bundle under `public/models/<folder>/`, with
its textures kept in `<folder>/textures/`. See `src/assets/models/README.md` for
the full mapping table (product → folder), folder structure, size limits, and
how to add a new model.

**Important:** models are matched to products by name (`src/data/modelRegistry.ts`).
Products without a matching model are not listed on the storefront, and if a
model fails to load the page shows the catalog photo plus an explicit
"3D view unavailable" notice — a static image is never presented as rotatable.

Every product card (home, products, favorites, cart) renders a live,
auto-rotating 3D preview when the product has a model: the canvas mounts only
while the card is near the viewport and fades in once the model is framed.
Only real product photos are displayed otherwise — generated placeholder
images are never shown.

**Storefront 3D extra:**

- The hero shows the animated shopping basket
  `public/models/cover_basket/loqta-cart-1.gltf` (drag to rotate, reset button).
- The "Get up to 70% off" row renders four more real models from
  `public/models/`: `samsung_galaxy_s21_ultra`, `playstation_ps5`,
  `rotom_game_boy` and `camers1` (DJI FPV drone), each with a discount badge.
  These mount only when the row scrolls into view (the drone bundle is 16 MB).

---

## Deployment (Cloudflare Pages)

1. Push this folder to its own GitHub repository (keep the backend repo separate).
2. In Cloudflare Pages create a project from that repo:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Root directory:** repository root (this folder *is* the app)
3. Add the environment variable:
   - `VITE_API_BASE_URL = https://loqta-feto.onrender.com/api/v1`
4. SPA routing in production is handled by `public/_redirects`
   (`/* /index.html 200`) — refresh deep links like `/products?q=phone` work.
5. `dist` and `.env` are already gitignored — **no secrets are committed**.

*(The project has not actually been pushed or deployed by this document: perform
steps 1–5 yourself and verify the build on the Pages dashboard.)*

---

## Accessibility & i18n

- Arabic RTL and English LTR layouts with a language switcher (`Intl` currency formatting).
- Labeled forms, keyboard-navigable menus, `aria-label`s on icon buttons, alt text on images.
- Honors the OS **prefers-reduced-motion** setting (idle 3D rotation is disabled).
- Product grids adapt from 1 column (mobile) to 4 columns (desktop).

## Project Structure

```
frontend_loqta/
├── public/_redirects          # Cloudflare Pages SPA fallback
├── src/
│   ├── components/
│   │   ├── 3d/                # Product3DViewer (lazy) + Viewer3D canvas
│   │   ├── layout/            # Navbar, Footer
│   │   └── products/          # ProductCard
│   ├── data/demoProducts.ts   # eight reference demo products (all with 3D models)
│   ├── lib/                   # i18n dictionary, mappers, utils
│   ├── pages/                 # Home, Products, Categories, ProductDetails,
│   │                          # Cart, Favorites, Login, Register,
│   │                          # ForgotPassword, Profile
│   ├── services/              # api.ts (central layer), types.ts
│   ├── store/                 # Zustand store (user/favorites/cart sync)
│   └── test/                  # test setup
├── .env.example
└── vite.config.ts
```

## Known Limitations (honest list)

- **Admin dashboard is not implemented** — the frontend has no admin UI; admin
  actions run through the backend API. This is deliberate: no fake admin panel.
- **Orders/checkout is demo-level**: the packaging cart syncs with the live
  backend, but this version contains no payment system (the payload button is
  annotated as demo).
- **Real 3D models are missing**: only the CC0 sample model is wired; product
  detail pages fall back to images until real GLB assets exist.
- Backend password restore depends on the deployment's mail sender (backend
  concern).
- Session revoke / sessions list page not built (endpoints exist).
