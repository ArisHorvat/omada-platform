# Omada Mobile (Expo)

Primary Omada client: **iOS**, **Android**, and **web** (Expo Router). Organization-themed UI, widget dashboard, universal search, organization admin console, platform admin, map/floorplans, web spider admin, chat, and more.

**Structure guide:** [`../../../docs/Frontend.md`](../../../docs/Frontend.md)  
**Configuration:** [`../../../docs/Configuration.md`](../../../docs/Configuration.md)  
**Monorepo overview:** [`../../../README.md`](../../../README.md)

---

## Prerequisites

- Node.js (LTS)  
- [Expo](https://docs.expo.dev/) dev environment  
- **Omada.Api** running (default `http://localhost:5069`)  
- For a physical device: backend and phone on the same network; set LAN IP in `.env`

---

## Quick start

```bash
cd src/frontend/mobile
copy .env.example .env
# Edit EXPO_PUBLIC_API_BASE_URL if not using localhost (e.g. http://192.168.1.10:5069)
npm install
npm run start
```

| Script | Purpose |
|--------|---------|
| `npm run start` | Expo dev server (dev client) |
| `npm run android` / `ios` | Native run |
| `npm run web` | Expo web bundle |
| `npm run generate-api` | Regenerate `src/api/generatedClient.ts` from Swagger |
| `npm run lint` | ESLint |

**After changing `.env`**, restart Expo (`EXPO_PUBLIC_*` is inlined at bundle time).

---

## Configuration

### API base URL

| Source | Used by |
|--------|---------|
| `.env` → `EXPO_PUBLIC_API_BASE_URL` | `src/config/config.ts` → `API_BASE_URL` |
| `.env` → `EXPO_PUBLIC_APP_BASE_URL` | `src/config/config.ts` → `APP_BASE_URL` (invite links) |
| Fallback in `config.ts` | `http://localhost:5069` (API), `http://localhost:8081` (app) |

`API_BASE_URL`, `APP_BASE_URL`, and `WS_BASE_URL` are imported by:

- `src/api/index.ts` — NSwag-generated clients  
- `src/api/apiClient.ts` — Axios instance + refresh  
- Media URL helpers (`resolveMediaUrl`, `toAbsoluteMediaUrl`)

Copy **`.env.example`** → **`.env`** (gitignored). Do not commit machine-specific IPs.

### Backend secrets

Roboflow, Gemini, and SQL live in **`src/backend/Omada.Api/.env`**, not in the mobile app. The mobile app only needs the **public API URL**.

---

## API layer (NSwag)

- Generated client: `src/api/generatedClient.ts`  
- Thin exports: `src/api/index.ts` (`orgAdminApi`, `superAdminApi`, `adminApi`, `scheduleApi`, …)  
- Interceptors / auth: `src/api/apiClient.ts`  

Regenerate when backend DTOs or routes change:

```bash
# API must be running on port 5069
npm run generate-api
```

Uses `http://localhost:5069/swagger/v1/swagger.json`.

---

## Architecture

| Area | Location |
|------|----------|
| **Routes** | `src/app/` — `(app)/(admin)/` workspaces, `(superadmin)/`, widgets, tabs |
| **Screens** | `src/screens/` — often `ui/`, `hooks/`, `styles/` per feature |
| **Components** | `src/components/` — Clay design system (`ClayView`, `AppButton`, …) |
| **Hooks** | `src/hooks/` |
| **Context** | `src/context/` — auth, organization, permissions |
| **Permissions** | `src/config/permissions.config.ts` — mirrors backend `WidgetKeys` |
| **Theme** | `src/styles/` — organization primary/secondary/tertiary |
| **i18n types** | `src/types/` |

### Patterns

- **Smart/dumb split** — data fetching in hooks; presentational components in `ui/`  
- **React Query** — server state; avoid raw `useEffect` fetch  
- **Permissions** — `PermissionContext` + `can(capability)` from widget levels  
- **Org switch** — theme and API context follow active organization  

---

## Notable features

### Dynamic theming

Organization colors from API; `useThemeColors()` across the UI.

### Widget dashboard

Registry-driven widgets (`hero`, `card`, `bento`, `rail`). Enabled set = org widget catalog ∩ role permissions. Universal search on the dashboard.

### Organization admin

Hub: **`/org-dashboard`**. Workspaces: members, roles, branding, widgets, periods, grades, attendance, rooms, audit log, floorplan, web spider, groups, event types. Onboarding checklist tracks setup progress.

### Platform admin (SuperAdmin)

**`/admin-dashboard`** — list/search/delete organizations; tap to enter org context and open org admin.

### Map & floorplan admin

- Upload floorplan → backend Roboflow extraction → GeoJSON  
- Workspace under `src/screens/admin/floorplan-workspace/`  
- Requires map **Admin** on the API  

### Web spider admin

- `web-spider-workspace` — configure URLs, preview, enqueue sync  
- Requires **admin** widget + Admin  
- See [`../../../docs/WebSpider.md`](../../../docs/WebSpider.md)

### Offline / sync

Some repositories queue mutations when offline and sync when back online (organization flows).

### Registration wizard

Multi-step org creation under `app/(auth)/register-flow/`:

1. Organization details → admin account → branding → roles → widgets → **invite users** (link/code or email list).

After creation, admins receive onboarding details (email logged in dev) and can share **`inviteCode`** / **`inviteLink`** from the success screen.

### Join organization

Users with an invite open `app/(auth)/join` (or `/join?code=…`) to register and join via **`POST /api/Auth/join`**.

---

## Project structure (abbreviated)

```text
src/
├─ app/                 # Expo Router routes
├─ api/                 # generatedClient + clients
├─ config/
│  ├─ config.ts         # API_BASE_URL from EXPO_PUBLIC_*
│  └─ permissions.config.ts
├─ components/
├─ context/
├─ hooks/
├─ screens/
└─ styles/
.env.example            # committed template
.env                    # gitignored — your API URL
```

---

## User guide

End-user flows (registration, invites, join): [`TUTORIAL.md`](TUTORIAL.md)

---

## Related docs

| Doc | Topic |
|-----|--------|
| [`../../../docs/Frontend.md`](../../../docs/Frontend.md) | Full frontend structure guide |
| [`../../../docs/Backend.md`](../../../docs/Backend.md) | API structure |
| [`../../../docs/Configuration.md`](../../../docs/Configuration.md) | `.env` for API and mobile |
| [`../../../docs/WebSpider.md`](../../../docs/WebSpider.md) | Web crawling |
