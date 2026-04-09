# 🏢 Omada Platform

Omada is a **multi-tenant platform for universities and organizations** that brings schedules, news, tasks, rooms, map navigation, directory, chat, and digital identity into a single, customizable experience.

Each user account can belong to **multiple organizations**. Switching organizations behaves like switching “instances”: **theme/branding**, permissions, and data all scope to the active organization.

---

## ✨ Key capabilities

- 📊 **Widget-driven dashboard**: organizations enable the modules they need (news, schedule, rooms, map, grades, tasks, chat, etc.)
- 🔐 **Multi-tenant & secure by default**: tenant isolation via `OrganizationId` and role-based widget permissions
- ⚡ **Real-time + offline-friendly**: SignalR updates where relevant, plus client-side caching and resilient UX patterns on mobile
- 🕷️ **Optional web ingestion**: crawl and parse public university/organization pages for **schedule tables** and **news-style articles**, with AI-assisted fallbacks when HTML layout changes
- 🗺️ **Map & floorplans**: upload building floorplan images, run a **CV + OCR** microservice to derive **GeoJSON** room geometry, and visualize pins/rooms in the mobile map experience

---

## 🛠️ Tech stack

- **Backend**: ASP.NET Core (.NET 8), EF Core, NSwag (OpenAPI), FluentValidation, SignalR
- **Mobile**: React Native (Expo Router), React Query, Axios, Skia
- **Web**:
  - **Primary web build**: Expo web (`src/frontend/mobile` → `npm run web`)
  - **Optional** Next.js app: `src/frontend/web` (placeholder / future separate web-only surfaces)
- **Services**: Python microservice for AI-powered floorplan processing (`src/services/ai-floorplan`)

---

## 📁 Repository structure

```text
.
├─ src/
│  ├─ backend/
│  │  ├─ Omada.Api/                 # ASP.NET Core API (Swagger, SignalR, tenancy, permissions)
│  │  ├─ Omada.Web/                 # Optional server-rendered site / docs pages (if used)
│  │  └─ Omada.sln
│  ├─ frontend/
│  │  ├─ mobile/                    # Expo app (iOS/Android/Web)
│  │  └─ web/                       # Optional Next.js app (not the main web client)
│  └─ services/
│     └─ ai-floorplan/              # Python service (floorplan processing)
└─ README.md
```

---

## 🧭 Product model (high level)

### 👥 Organizations, membership, and tenancy

- **Organization**: a university/company “space” with its own theme and enabled widgets.
- **User**: a global account that can be a member of multiple organizations.
- **Active organization**: selected at runtime; drives theming + permission checks + data scoping.

On the backend, tenant isolation is enforced using `OrganizationId` (from JWT) and EF Core query filters. On the frontend, API calls and UI state align to the currently selected organization context.

### 🧩 Widgets (modules)

Widget keys are centralized on the backend in `Omada.Api.Infrastructure.WidgetKeys` and mirrored on the mobile app for capability mapping. Examples include:

- **Core**: `profile`, `security`, `settings`, `more`, `admin`, `super-admin`
- **Communication**: `chat`, `news`, `events`
- **Productivity**: `schedule`, `tasks`, `documents`
- **Academic**: `grades`, `assignments`, `attendance`
- **Operations**: `users`, `groups`, `rooms`, `map`, `digital-id`

### 🔐 Permissions

Permissions are widget-scoped with cumulative levels: **View → Edit → Admin**. The API enforces access with a `HasPermission` policy per widget and access level.

---

## 🚀 Getting started (local development)

### 📋 Prerequisites

- **.NET 8 SDK**
- **Node.js** (LTS recommended)
- **Expo development environment** (Android Studio / Xcode as needed)

### 1) ⚙️ Run the backend API

The API is configured to run on **port `5069`** in development.

```bash
cd src/backend/Omada.Api
dotnet restore
dotnet run
```

- 📄 **Swagger UI**: `http://localhost:5069/swagger`

> 💡 Note: `appsettings.json` currently contains example/local values. For real deployments, secrets (JWT keys, API keys) should be stored via environment variables / user secrets.

### 2) 📱 Run the mobile app (Expo)

```bash
cd src/frontend/mobile
npm install
npm run start
```

The mobile app API base URL lives in:

- `src/frontend/mobile/src/config/config.ts` (`API_BASE_URL`, `WS_BASE_URL`)

If you test on a physical device, set `API_BASE_URL` to your machine’s LAN IP (as shown in the current config).

### 3) 🔌 Generate the TypeScript API client (NSwag)

The mobile app uses NSwag to generate `src/api/generatedClient.ts` directly from Swagger:

```bash
cd src/frontend/mobile
npm run generate-api
```

This command reads:

- `http://localhost:5069/swagger/v1/swagger.json`

So make sure the backend is running first.

---

## 🕷️ Web spider (schedule & news ingestion)

The backend includes a **`WebSpiderService`** that fetches public HTML with a dedicated `HttpClient` (custom **User-Agent**, bounded timeouts). It is built for **university-style sites** where timetables are often published as HTML tables and news lives under predictable URL patterns.

### 🔍 What it does

**📅 Schedule discovery & extraction**

- **Breadth-first crawl** of in-domain links starting from a URL, with **hard caps** on how many pages are visited so crawls cannot run unbounded.
- Each page is **classified** (e.g. menu-like vs schedule-like) using heuristics such as table headers matching timetable vocabulary (time, room, course, group, professor, etc.).
- **Primary path**: parse the first schedule-like **HTML `<table>`** with **HtmlAgilityPack**, including tricky layouts with **`rowspan` / `colspan`**, and map columns to structured rows (`ScrapedEventDto`: time, class name, room text, professor, group).
- **Fallback path**: if the site’s markup drifts (no table, empty grid, zero rows), the service strips HTML to plain text and uses the **Gemini** integration (`IGeminiService`) to extract schedule rows from text—so brittle scrapers get a second chance when the DOM changes.

**📰 News discovery & extraction**

- Separate crawl tuned for **news / blog / announcements** URL patterns and article vs listing pages.
- **Article extraction** removes boilerplate (scripts, nav, sidebars), pulls a main **title + body**, and optionally asks **Gemini** to **categorize** the excerpt when an API key is configured—if categorization fails, the app falls back to a default category.

### 💾 Syncing scraped schedules into the database

**`ScheduleSpiderSyncService`** turns HTML rows into durable **`ScrapedClassEvent`** records **per organization**:

- Resolves the schedule page URL from configuration (see below), fetches HTML via the spider, runs **`ExtractScheduleFromTableAsync`**, then **merges** with existing rows using a **natural key** (normalized class name, time, group) and a **content hash** so updates are detected without rewriting unchanged rows.
- **`ScrapedEntityResolutionService`** links scraped **room text** and **professor names** to internal **room / host** entities where possible, so downstream features (rooms, map, schedule UI) can relate scraped strings to real IDs.
- Rows that disappear from the latest scrape are **removed** from the stored set so the DB mirrors the current page.

**⏰ Automation (Hangfire)**

- The API hosts **Hangfire** (SQL Server storage) and exposes the dashboard at **`/hangfire`** in development. Job entry points live in **`ScheduleSyncJobs`** (e.g. `SyncScheduleDatabaseAsync` per organization) so long-running sync work runs outside the HTTP request thread with **scoped DI** and **automatic retries**.

### ⚙️ Configuration (`appsettings`)

| Key | Purpose |
|-----|--------|
| `Spider:DefaultSchedulePageUrl` | Fallback URL for the published timetable page when no per-org override exists |
| `Spider:Organizations:{OrganizationId}:SchedulePageUrl` | Per-organization schedule page (GUID key) |
| `Gemini:ApiKey` / `Gemini:Model` | Optional; enables Gemini fallbacks for schedule extraction and news categorization |

⚠️ Respect **robots.txt**, **terms of use**, and **rate limits** of source sites; this subsystem is intended for **authorized** institutional use and pages you are allowed to ingest.

---

## 🗺️ Floorplan processing (AI microservice + API)

Indoor **map** flows use **building → floor → floorplan image + GeoJSON** so the app can overlay rooms and pins. Heavy image work is delegated to a **small Python service** so the .NET API stays focused on auth, tenancy, and persistence.

### 🐍 Python service (`src/services/ai-floorplan`)

- **Stack**: **FastAPI** + **OpenCV** + **Tesseract** (via `pytesseract`) for contour detection and OCR of room labels.
- **Endpoints**:
  - `GET /health` — liveness check
  - `POST /process-floorplan` — multipart upload (`file` field); returns a **GeoJSON `FeatureCollection`** describing detected regions (normalized coordinates aligned with the **\[0..1\]** convention used by the mobile floorplan viewer).
- **Pipeline (summary)**: decode image → optional resize → adaptive threshold + morphology → find contours → filter by area → approximate polygons → OCR on bounding boxes → build GeoJSON; if CV fails, a **mock GeoJSON** path can still return a valid payload for development.
- **Run locally** (from `main.py`):

```bash
cd src/services/ai-floorplan
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

💻 **Note:** Tesseract must be installed on the machine (the code looks for common Windows install paths if `tesseract` is not on `PATH`).

### 🔷 .NET integration (`FloorplanProcessingService`)

- Configuration: **`AiService:BaseUrl`** (e.g. `http://localhost:8000`) — if missing, floorplan upload returns a clear configuration error.
- On upload: validates **image** content type, ensures the **floor** belongs to the **current organization**, saves the file under **`wwwroot/images/maps/floorplans/`**, **POSTs** the file to `{BaseUrl}/process-floorplan`, normalizes the returned GeoJSON, and **upserts** the **`Floorplan`** row (image URL + `GeoJsonData`).
- HTTP client factory registers a named client with a **long timeout** (minutes) suitable for image processing.

### 🌐 HTTP API & app surface

- **`FloorplansController`**: upload requires **`map` widget + Admin**; read by id requires **`map` + View**. Admin flows in the mobile app (e.g. mapping tool) upload floorplans; end users with map access consume the stored image + GeoJSON in the **floorplan viewer** (pins, room overlays, theme-aware rendering).

---

## 📝 Notes on code quality & conventions

- **Monorepo, vertical slices**: backend contracts/DTOs → NSwag client → mobile hooks/UI
- **Consistent API envelopes**: backend uses a structured error/result model (`AppError`, `ServiceResponse`)
- **Security & multi-tenancy**: tenant and permission checks are enforced server-side; the client renders UI capabilities accordingly
