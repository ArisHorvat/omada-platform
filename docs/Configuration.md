# Configuration guide

How to configure **Omada.Api** and the **Expo mobile** client for local development and new clones from GitHub.

> **Structure guides:** [`Backend.md`](Backend.md) · [`Frontend.md`](Frontend.md)

---

## Overview

| Layer | Committed (safe defaults) | Local only (gitignored) |
|-------|---------------------------|-------------------------|
| **Backend** | `src/backend/Omada.Api/appsettings.json`, `appsettings.Development.json` | `src/backend/Omada.Api/.env` |
| **Mobile** | `src/frontend/mobile/src/config/config.ts` (fallback URL) | `src/frontend/mobile/.env` |

**Rule of thumb:** put **secrets** and **machine-specific** values in `.env`. Put **shared defaults** (model ids, feature flags, public URLs for dev) in `appsettings`.

The API loads `.env` on startup via [DotNetEnv](https://github.com/tonerdo/dotnet-env) (`Infrastructure/Configuration/DotEnvBootstrap.cs`). Existing `ROBOFLOW_*` variable names from the old Python service still work.

---

## Backend (`Omada.Api`)

### First-time setup

```bash
cd src/backend/Omada.Api
copy .env.example .env
# Edit .env — at minimum set ROBOFLOW_API_KEY if you use floorplan AI
dotnet restore
dotnet run
```

- Swagger: `http://localhost:5069/swagger`
- Default port: **5069** (see `Properties/launchSettings.json`)

### `appsettings.json` (committed)

Non-secret defaults shared by the team:

| Section | Purpose |
|---------|---------|
| `ConnectionStrings:DefaultConnection` | Empty in base file; see Development |
| `Jwt` | Issuer/audience; **Key must be set** via Development, `.env`, or user secrets |
| `Roboflow` | Model ids (`room-segmentation-o7iga/4`, etc.), API URL, flags — **not** the API key |
| `Gemini` | Model name; **ApiKey** empty (optional web-spider AI fallback) |
| `Spider` | Optional fallback schedule URL if org DB fields are empty |
| `AppConfig:BaseUrl` | Public base URL of this API (for media links); default `http://localhost:5069` |
| `AppConfig:PublicAppUrl` | Public base URL of the **mobile/web app** for organization invite links; default `http://localhost:8081` |
| `DigitalId` | QR token lifetime and scanner key |

### `appsettings.Development.json` (committed)

Overrides when `ASPNETCORE_ENVIRONMENT=Development`:

- **SQL Server LocalDB** connection string (change in `.env` if you use full SQL Express)
- **Dev JWT signing key** (do not use in production)
- **`AppConfig:BaseUrl`** → `http://localhost:5069`
- **`AppConfig:PublicAppUrl`** → `http://localhost:8081` (invite links in emails / org create response)

### `.env` (gitignored — copy from `.env.example`)

Use for **secrets** and **personal overrides**:

```env
# Required for floorplan AI
ROBOFLOW_API_KEY=your-roboflow-key

# Optional — override SQL when not using LocalDB
# ConnectionStrings__DefaultConnection=Server=...;Database=Omada;...

# Optional — LAN IP when phones need to reach your PC's API (also set on mobile)
# AppConfig__BaseUrl=http://192.168.1.10:5069

# Optional — public app URL for organization invite links (Expo web / deployed app)
# AppConfig__PublicAppUrl=http://192.168.1.10:8081

# Optional — web spider AI fallback (either name works)
# Gemini__ApiKey=
# GEMINI_API_KEY=

# Optional — override Roboflow models without editing appsettings
# ROBOFLOW_MODEL_ID=room-segmentation-o7iga/4
# ROBOFLOW_ELEMENTS_MODEL_ID=cubicasa5k-2-qpmsa/6
```

**ASP.NET environment variable syntax:** use `__` for nesting, e.g. `Roboflow__ApiKey`, `ConnectionStrings__DefaultConnection`.

**Legacy aliases** (from the former Python `ai-floorplan` service) are mapped in `RoboflowFloorplanEnvFallbacks` when `Roboflow:ApiKey` is empty:

- `ROBOFLOW_API_KEY` → API key  
- `ROBOFLOW_MODEL_ID` → primary model  
- `ROBOFLOW_ELEMENTS_MODEL_ID` → secondary model (auto-enabled when set)  
- `ROBOFLOW_ELEMENTS_MODEL_ENABLED`, `AI_FLOORPLAN_INCLUDE_DOOR_WINDOW_WALL_POLYGONS`

`ROBOFLOW_WORKSPACE` and `ROBOFLOW_WORKFLOW_ID` are **not used** by the API (detect API uses `ModelId` only).

### Configuration priority (backend)

1. Environment variables / `.env` (loaded into the process environment)  
2. `appsettings.{Environment}.json`  
3. `appsettings.json`  
4. User secrets (optional, `dotnet user-secrets`)

Later sources override earlier ones for the standard ASP.NET configuration chain; Roboflow **API key** also accepts `ROBOFLOW_API_KEY` when `Roboflow:ApiKey` is blank.

### Production

- Do **not** commit `.env` or production secrets.  
- Use host environment variables, Azure Key Vault, etc.  
- Set a strong `Jwt:Key` and real `ConnectionStrings:DefaultConnection`.  
- Set `Roboflow:ApiKey` (or `ROBOFLOW_API_KEY` in the host env).

---

## Mobile (`src/frontend/mobile`)

### First-time setup

```bash
cd src/frontend/mobile
copy .env.example .env
npm install
npm run start
```

### `.env` (gitignored — copy from `.env.example`)

```env
# Simulator / same machine
EXPO_PUBLIC_API_BASE_URL=http://localhost:5069

# Public app URL for invite links (Expo web default port)
EXPO_PUBLIC_APP_BASE_URL=http://localhost:8081

# Physical device on Wi‑Fi — use your PC's LAN IP
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5069
# EXPO_PUBLIC_APP_BASE_URL=http://192.168.1.10:8081
```

Expo inlines `EXPO_PUBLIC_*` variables at bundle time. **Restart** `npx expo start` after changing `.env`.

### `src/config/config.ts`

- Reads `process.env.EXPO_PUBLIC_API_BASE_URL`  
- Reads `process.env.EXPO_PUBLIC_APP_BASE_URL` (invite link base; falls back to `window.location.origin` on web, else `http://localhost:8081`)  
- Falls back to `http://localhost:5069` for API  
- Exports `API_BASE_URL`, `APP_BASE_URL`, `WS_BASE_URL`, and `buildOrganizationJoinLink()`

Do not hardcode LAN IPs in committed files; use `.env` instead.

### Regenerate API client (NSwag)

Backend must be running on port 5069:

```bash
cd src/frontend/mobile
npm run generate-api
```

Output: `src/api/generatedClient.ts` (do not edit by hand).

---

## Feature-specific config

### Floorplan AI (map admin)

- **Backend:** `Roboflow:ApiKey` or `ROBOFLOW_API_KEY` in `.env`  
- **Models:** `appsettings.json` → `Roboflow:ModelId`, `ElementsModelId`  
- **Flow:** Mobile admin uploads image → `POST /api/floorplans/...` → `FloorplanProcessingService` → `RoboflowFloorplanGeoJsonExtractor` → GeoJSON stored on `Floorplan`  
- No separate Python service.

### Web spider (schedule / news)

- **URLs:** stored per organization in the database (admin UI), not in `.env`  
- **Optional:** `Gemini:ApiKey` or `GEMINI_API_KEY` for AI fallbacks when HTML parsing fails  
- **Details:** [`WebSpider.md`](WebSpider.md)

---

## Quick checklist (new clone)

- [ ] `src/backend/Omada.Api/.env` from `.env.example` + `ROBOFLOW_API_KEY`  
- [ ] SQL: LocalDB (Development) or `ConnectionStrings__DefaultConnection` in `.env`  
- [ ] `dotnet run` in `Omada.Api` → Swagger loads  
- [ ] `src/frontend/mobile/.env` from `.env.example` + correct `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_APP_BASE_URL` (for invite links on device/LAN)  
- [ ] `npm run generate-api` with API running  
- [ ] `npm run start` in mobile  

---

## Related docs

- [Root README](../README.md) — product overview and repo layout  
- [Backend.md](Backend.md) — API folders, controllers, and features  
- [Frontend.md](Frontend.md) — mobile app structure and routes  
- [WebSpider.md](WebSpider.md) — crawling and sync  
