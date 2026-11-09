# KalingaLink Frontend

KalingaLink's frontend is a standalone React 19, TypeScript, Vite, and React
Router application. The PHP LavaLust backend is maintained separately in the
repository root under `app/`, `scheme/`, and `public/`. The browser communicates
with the backend over HTTP APIs; it never connects directly to MySQL.

## Requirements

- Node.js LTS and npm
- The LavaLust API for authenticated or database-backed workflows

## Local development

```powershell
npm ci
npm run dev
```

Vite serves the standalone frontend at the URL it prints (usually
`http://localhost:5173/`) and proxies `/api` requests to
`http://127.0.0.1:8000`. Start the backend from its repository root in a
separate terminal:

```powershell
php -S 127.0.0.1:8000 -t public public/dev-router.php
```

If the backend is listening elsewhere, set `VITE_API_PROXY_TARGET` in an
ignored `.env.local` file:

```dotenv
VITE_API_PROXY_TARGET=http://127.0.0.1:8001
```

Restart Vite after changing `.env.local` so it picks up the new proxy target.

For direct browser-to-backend development instead of the Vite proxy, copy
`.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend
origin. The backend must allow the Vite origin in `API_ALLOWED_ORIGINS`.
The backend refresh cookie defaults to `Path=/` so it is sent both through the
Vite `/api` proxy and when the LavaLust API is hosted below a path such as
`/LavaLust-dev-v4/public/api`. If hosting multiple apps on one domain, set
`REFRESH_COOKIE_PATH` in the backend environment to an appropriate shared API
path and keep that path consistent for login, refresh, and logout.

For the legacy same-origin LavaLust development route, run
`npm run dev:embedded`; the app's route base is then `/app`.

## Production builds

### Standalone frontend

```powershell
npm run build
```

This type-checks the app and writes a static site to `dist/`. The Nginx config
falls back to `index.html` for React Router URLs. When frontend and backend
are on different origins, provide the backend origin at build time:

```powershell
$env:VITE_API_BASE_URL = 'https://api.example.com'
npm run build
```

Build a standalone Nginx container from the repository root:

```powershell
docker build -f SIAkalingaLink/Dockerfile -t kalingalink-frontend SIAkalingaLink
```

For a separate backend origin, pass it as a Docker build argument:

```powershell
docker build `
  --build-arg VITE_API_BASE_URL=https://api.example.com `
  -f SIAkalingaLink/Dockerfile `
  -t kalingalink-frontend `
  SIAkalingaLink
```

The API must allow the deployed frontend's exact origin using
`API_ALLOWED_ORIGINS`. For cross-site frontend/API hosting, configure
`REFRESH_COOKIE_SAMESITE=None` and serve the API over HTTPS. Set
`REFRESH_COOKIE_SECURE=1` for HTTPS production deployments, especially when
TLS terminates at a reverse proxy. Browser privacy settings may restrict
cross-site cookies; hosting the frontend and API on sibling subdomains of the
same site is preferred.

### Embedded compatibility build

```powershell
npm run build:embedded
```

This compatibility build writes assets to `../public/kalingalink/` and mounts
the React routes at `/app`. LavaLust's existing `FrontendController` continues
to serve this optional bundle; standalone frontend deployments do not require
that controller.

## Commands

- `npm run dev` — standalone Vite development server.
- `npm run dev:embedded` — Vite server using the legacy `/app` route base.
- `npm run build` — TypeScript check and standalone static build.
- `npm run build:embedded` — TypeScript check and legacy LavaLust bundle.
- `npm run lint` — ESLint checks.
- `npm run format:check` — Prettier formatting verification.

## Source layout

- `src/auth/` — authentication provider and role-based frontend route guards.
- `src/components/` — shared UI components.
- `src/pages/` — parent, teacher, and administrator experiences.
- `src/routes/` — React route composition.
- `src/styles/` — shared styles and tokens.
- `src/constants/` — application labels and route paths.
- `public/` — frontend-only static assets.
- `Dockerfile`, `nginx.conf` — standalone static frontend deployment.
- `.env.embedded` — non-secret settings for the compatibility build.

Authentication, authorization, validation, business workflows, file handling,
notifications, and database operations belong to the LavaLust backend. A page
is database-backed only when its operation calls a backend endpoint and handles
the persisted response; client-side state alone is not persistence.

Parent profile details are read from `GET /api/me` and saved to
`PATCH /api/parent/profile`. Enrollment center choices are restricted by the
backend to the three configured CDCs; child profiles show only approved,
enrolled children, while application status remains available separately.

Authentication refreshes are serialized across browser tabs to avoid refresh
token rotation races. The short-lived access token is refreshed automatically;
the refresh cookie is session-scoped unless “Remember me” is selected.
