# Omada Platform

Omada is a **multi-tenant platform for universities and organizations** that brings schedules, news, tasks, rooms, map navigation, directory, chat, and digital identity into a single, customizable experience.

Each user account can belong to **multiple organizations**. Switching organizations behaves like switching “instances”: **theme/branding**, permissions, and data all scope to the active organization.

---

## Key capabilities

- **Organization admin console** — members, roles, branding, academic periods, grades, attendance, widget catalog, rooms, audit log, map/floorplans, web spider, groups
- **Platform admin (SuperAdmin)** — list/manage organizations, enter any org context, platform-wide audit log
- **Universal search** — cross-widget search scoped to permissions and org-enabled widgets
- **Widget-driven dashboard** — org-wide widget catalog plus per-role permissions (news, schedule, rooms, map, grades, tasks, chat, etc.)
- **Multi-tenant & secure by default** — tenant isolation via `OrganizationId` and role-based widget permissions
- **Organization invites** — unique invite code + link per org; email invitations at registration; self-service join via `/join`
- **Real-time** — SignalR where relevant; mobile uses React Query and offline-friendly patterns
- **Web ingestion** — crawl public timetable and news pages (`WebSpiderService`), with optional Gemini fallbacks
- **Map & floorplans** — upload floorplan images; **Roboflow** segmentation in the API produces **GeoJSON** room geometry for the map viewer

---

## Tech stack

| Area | Stack |
|------|--------|
| **Backend** | ASP.NET Core (.NET 8), EF Core, NSwag, FluentValidation, SignalR, Hangfire |
| **Mobile / web app** | React Native (Expo Router), React Query, generated Axios client |
| **Optional** | Next.js placeholder at `src/frontend/web` (not the main product UI) |

---

## Repository structure

```text
.
├─ src/
│  ├─ backend/
│  │  ├─ Omada.Api/          # Main API (Swagger, SignalR, tenancy, floorplan AI, web spider)
│  │  ├─ Omada.Web/          # Optional server-rendered pages
│  │  └─ Omada.sln
│  └─ frontend/
│     ├─ mobile/             # Primary client (iOS, Android, Expo web)
│     └─ web/                # Optional Next.js (marketing / future use)
├─ docs/
│  ├─ Configuration.md       # .env, appsettings, EXPO_PUBLIC_* — start here for setup
│  ├─ Backend.md             # API folder structure and features
│  ├─ Frontend.md            # Mobile/web folder structure
│  └─ WebSpider.md           # Web spider architecture and admin API
└─ README.md
```

There is **no separate Python service**; floorplan AI runs inside `Omada.Api`.

---

## Getting started (local development)

Full details: **[`docs/Configuration.md`](docs/Configuration.md)**

### Prerequisites

- .NET 8 SDK  
- Node.js (LTS)  
- SQL Server or LocalDB (Development config uses LocalDB by default)  
- Expo tooling (Android Studio / Xcode as needed)  
- Roboflow API key (only if you use **floorplan AI extraction** in map admin)

### 1) Backend API

```bash
cd src/backend/Omada.Api
copy .env.example .env
# Edit .env — set ROBOFLOW_API_KEY if using floorplan AI; override SQL connection if needed
dotnet restore
dotnet run
```

| Resource | URL |
|----------|-----|
| Swagger | `http://localhost:5069/swagger` |
| Hangfire dashboard | `http://localhost:5069/hangfire` (when enabled) |

### 2) Mobile app

```bash
cd src/frontend/mobile
copy .env.example .env
# Set EXPO_PUBLIC_API_BASE_URL (LAN IP when testing on a physical device)
npm install
npm run start
```

`config.ts` reads `EXPO_PUBLIC_API_BASE_URL` and defaults to `http://localhost:5069`.

### 3) Generate TypeScript API client

With the API running:

```bash
cd src/frontend/mobile
npm run generate-api
```

Reads `http://localhost:5069/swagger/v1/swagger.json` → `src/api/generatedClient.ts`.

---

## Configuration summary

| What | Where |
|------|--------|
| Roboflow model ids, Gemini model name, JWT issuer | `appsettings.json` / `appsettings.Development.json` |
| Roboflow API key, SQL override, Gemini key | `src/backend/Omada.Api/.env` |
| Mobile API URL | `src/frontend/mobile/.env` → `EXPO_PUBLIC_API_BASE_URL` |
| Mobile app URL (invite links) | `src/frontend/mobile/.env` → `EXPO_PUBLIC_APP_BASE_URL` |
| Backend invite link base | `AppConfig:PublicAppUrl` in appsettings or `AppConfig__PublicAppUrl` in `.env` |
| Spider timetable/news URLs | Organization record (admin UI), not env files |

See **[`docs/Configuration.md`](docs/Configuration.md)** for variable names, priority, and checklists.

---

## Product model (high level)

### Organizations and tenancy

- **Organization** — tenant with theme, enabled widgets, and a unique **invite code** for self-service join  
- **User** — global account; can belong to multiple organizations  
- **Active organization** — drives theme, permissions, and API scoping  
- **Invites** — share link/code or email invites at registration; new users join via `POST /api/Auth/join`

Backend: `OrganizationId` from JWT + EF global filters (`IUserContext` / `ITenantAccessor`).

### Widgets and permissions

Widget keys live in `Omada.Api.Infrastructure.WidgetKeys` and mirror `src/frontend/mobile/src/config/permissions.config.ts`.

**Two layers:**

1. **Organization widget catalog** — which features are enabled org-wide (`Organization.EnabledWidgetKeysJson`; all configurable widgets enabled when unset).
2. **Role permissions** — per-role **View → Edit → Admin** access on enabled widgets only.

Enforced with `[HasPermission]` on controllers. SuperAdmin bypasses widget checks; SuperAdmins can switch into any active org via `POST /api/Auth/switch-org`.

Examples: `schedule`, `news`, `map`, `rooms`, `chat`, `grades`, `admin`, `super-admin`.

### Organization admin API

Tenant-scoped admin lives under **`/api/Organizations/current`** (`OrganizationAdminController`): settings, members, roles, periods, enabled widgets, audit logs. Widget catalog metadata: **`GET /api/Admin/widgets`**.

Mobile hub: **`/org-dashboard`** with workspaces (members, roles, branding, widgets, periods, grades, attendance, rooms, audit, floorplan, web spider, groups, event types).

### Platform admin (SuperAdmin)

**`/api/super-admin`** — list/detail/delete organizations, platform audit log. Mobile: **`/admin-dashboard`**; entering an org switches JWT context then opens org admin.

---

## Web spider (schedule & news)

Crawls public HTML for timetables and news; org admins configure URLs in the mobile **Web crawling** workspace.

| Doc | Content |
|-----|---------|
| [`docs/WebSpider.md`](docs/WebSpider.md) | Architecture, API endpoints, sync jobs, Gemini fallback |
| Admin UI | Organization admin → Web crawling (`/web-spider-workspace`) |
| API | `/api/web-spider/*` (requires **admin** widget + Admin) |

Optional: `Gemini:ApiKey` in `.env` when table parsing fails.

---

## Floorplan processing (map admin)

| Step | Component |
|------|-----------|
| Upload image | `FloorplansController` + `FloorplanProcessingService` |
| AI extraction | `RoboflowFloorplanGeoJsonExtractor` (ImageSharp + Roboflow detect API) |
| Storage | `wwwroot/images/maps/floorplans/` + `Floorplan.GeoJsonData` |
| Publish rooms | `PublishRoomsFromGeoJsonAsync` from GeoJSON polygons |

Requires **`map` widget + Admin** for upload; **`map` + View** to read. Configure **`ROBOFLOW_API_KEY`** in backend `.env` (see Configuration doc).

---

## Further reading

| Document | Purpose |
|----------|---------|
| [`docs/Configuration.md`](docs/Configuration.md) | Environment and appsettings for API + mobile |
| [`docs/Backend.md`](docs/Backend.md) | Backend folders, controllers, services, features |
| [`docs/Frontend.md`](docs/Frontend.md) | Mobile/web folder structure and conventions |
| [`src/backend/README.md`](src/backend/README.md) | Backend quick start |
| [`src/frontend/mobile/README.md`](src/frontend/mobile/README.md) | Mobile quick start and scripts |
| [`src/frontend/web/README.md`](src/frontend/web/README.md) | Optional Next.js app vs Expo web |
| [`docs/WebSpider.md`](docs/WebSpider.md) | Web spider deep dive |

---

## Conventions

- **Vertical slices** — backend DTOs → Swagger → `npm run generate-api` → mobile hooks/UI  
- **API envelopes** — `ServiceResponse<T>` + `AppError`  
- **Tenancy** — never bypass org filters without an explicit reason  
- **Secrets** — only in `.env`, user secrets, or host configuration — never committed  
