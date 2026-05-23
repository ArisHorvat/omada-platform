# 🔧 Configuration Guide

> Everything you need to configure **Omada.Api** and the **Expo mobile** client — from first clone to production.

**Structure guides:** [`Backend.md`](Backend.md) · [`Frontend.md`](Frontend.md) · [`Architecture.md`](Architecture.md)

---

## 🗺️ Overview

| Layer | ✅ Committed (safe defaults) | 🔒 Local only (gitignored) |
|-------|------------------------------|----------------------------|
| **Backend** | `appsettings.json`, `appsettings.Development.json` | `src/backend/Omada.Api/.env` |
| **Mobile** | `src/config/config.ts` (fallback URL) | `src/frontend/mobile/.env` |

> 💡 **Rule of thumb:** **secrets** and **machine-specific** values → `.env`. **Shared defaults** (model ids, feature flags) → `appsettings`.

The API loads `.env` on startup via [DotNetEnv](https://github.com/tonerdo/dotnet-env) (`Infrastructure/Configuration/DotEnvBootstrap.cs`).

---

## ⚙️ Backend (`Omada.Api`)

### 🚀 First-time setup

```bash
cd src/backend/Omada.Api
copy .env.example .env
# Edit .env — set ROBOFLOW_API_KEY if using floorplan AI
dotnet restore
dotnet run
```

| Resource | URL |
|----------|-----|
| 📖 Swagger | `http://localhost:5069/swagger` |
| ⏰ Hangfire | `http://localhost:5069/hangfire` |
| 🔌 Default port | **5069** (`Properties/launchSettings.json`) |

---

### 📄 `appsettings.json` (committed)

Non-secret defaults shared by the team:

| Section | Purpose |
|---------|---------|
| `ConnectionStrings:DefaultConnection` | Empty in base; see Development |
| `Jwt` | Issuer/audience — **Key** must be set via Development / `.env` |
| `Roboflow` | Model ids, API URL, flags — **not** the API key |
| `Gemini` | Model name; **ApiKey** empty (optional spider fallback) |
| `Spider` | Fallback schedule URL if org DB fields empty |
| `AppConfig:BaseUrl` | Public API URL for media links — default `http://localhost:5069` |
| `AppConfig:PublicAppUrl` | Public app URL for invite links — default `http://localhost:8081` |
| `DigitalId` | QR token lifetime and scanner key |

---

### 🛠️ `appsettings.Development.json` (committed)

Overrides when `ASPNETCORE_ENVIRONMENT=Development`:

- 🗄️ **SQL Server LocalDB** connection string
- 🔑 **Dev JWT signing key** (never use in production)
- 🌐 **`AppConfig:BaseUrl`** → `http://localhost:5069`
- 🔗 **`AppConfig:PublicAppUrl`** → `http://localhost:8081`

---

### 🔒 `.env` (gitignored — copy from `.env.example`)

```env
# 🤖 Required for floorplan AI
ROBOFLOW_API_KEY=your-roboflow-key

# 🗄️ Optional — override SQL when not using LocalDB
# ConnectionStrings__DefaultConnection=Server=...;Database=Omada;...

# 🌐 Optional — LAN IP when phones need to reach your PC
# AppConfig__BaseUrl=http://192.168.1.10:5069

# 🔗 Optional — public app URL for invite links
# AppConfig__PublicAppUrl=http://192.168.1.10:8081

# ✨ Optional — web spider AI fallback
# Gemini__ApiKey=
# GEMINI_API_KEY=

# 🤖 Optional — override Roboflow models
# ROBOFLOW_MODEL_ID=room-segmentation-o7iga/4
# ROBOFLOW_ELEMENTS_MODEL_ID=cubicasa5k-2-qpmsa/6
```

**ASP.NET nesting syntax:** use `__` for nested keys, e.g. `Roboflow__ApiKey`, `ConnectionStrings__DefaultConnection`.

**Legacy aliases** (from former Python service) mapped when `Roboflow:ApiKey` is empty:

| Variable | Maps to |
|----------|---------|
| `ROBOFLOW_API_KEY` | API key |
| `ROBOFLOW_MODEL_ID` | Primary model |
| `ROBOFLOW_ELEMENTS_MODEL_ID` | Secondary model |
| `ROBOFLOW_ELEMENTS_MODEL_ENABLED` | Enable elements model |
| `AI_FLOORPLAN_INCLUDE_DOOR_WINDOW_WALL_POLYGONS` | Include door/window/wall polygons |

> ℹ️ `ROBOFLOW_WORKSPACE` and `ROBOFLOW_WORKFLOW_ID` are **not used** — detect API uses `ModelId` only.

---

### 📊 Configuration priority (backend)

```text
1. Environment variables / .env
2. appsettings.{Environment}.json
3. appsettings.json
4. User secrets (optional)
```

Roboflow **API key** also accepts `ROBOFLOW_API_KEY` when `Roboflow:ApiKey` is blank.

---

### 🏭 Production checklist

- ❌ Do **not** commit `.env` or production secrets
- ✅ Use host environment variables, Azure Key Vault, etc.
- ✅ Strong `Jwt:Key` + real `ConnectionStrings:DefaultConnection`
- ✅ Set `Roboflow:ApiKey` or `ROBOFLOW_API_KEY`
- ✅ Secure Hangfire dashboard

---

## 📱 Mobile (`src/frontend/mobile`)

### 🚀 First-time setup

```bash
cd src/frontend/mobile
copy .env.example .env
npm install
npm run start
```

---

### 🔒 `.env` (gitignored)

```env
# 💻 Simulator / same machine
EXPO_PUBLIC_API_BASE_URL=http://localhost:5069
EXPO_PUBLIC_APP_BASE_URL=http://localhost:8081

# 📱 Physical device on Wi‑Fi — use your PC's LAN IP
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5069
# EXPO_PUBLIC_APP_BASE_URL=http://192.168.1.10:8081
```

> ⚠️ Expo inlines `EXPO_PUBLIC_*` at bundle time — **restart** `npx expo start` after changes.

---

### ⚙️ `src/config/config.ts`

| Export | Source |
|--------|--------|
| `API_BASE_URL` | `EXPO_PUBLIC_API_BASE_URL` → fallback `http://localhost:5069` |
| `APP_BASE_URL` | `EXPO_PUBLIC_APP_BASE_URL` → fallback web origin or `http://localhost:8081` |
| `WS_BASE_URL` | Derived from API URL |
| `buildOrganizationJoinLink()` | Invite link builder |

Used by: `api/index.ts`, `api/apiClient.ts`, media URL helpers.

---

### 🔄 Regenerate API client (NSwag)

Backend must be running on port 5069:

```bash
cd src/frontend/mobile
npm run generate-api
```

Output: `src/api/generatedClient.ts` — **never edit by hand**.

---

## 🎯 Feature-specific config

### 🗺️ Floorplan AI (map admin)

| What | Where |
|------|-------|
| API key | `ROBOFLOW_API_KEY` in backend `.env` |
| Models | `appsettings.json` → `Roboflow:ModelId`, `ElementsModelId` |
| Flow | Mobile upload → `POST /api/floorplans/...` → Roboflow → GeoJSON on `Floorplan` |

No separate Python service — all in `Omada.Api`.

---

### 🕷️ Web spider (schedule / news)

| What | Where |
|------|-------|
| URLs | **Database** — `Organization.SpiderSchedulePageUrl`, `SpiderNewsStartUrl` |
| AI fallback | `GEMINI_API_KEY` in backend `.env` (optional) |
| Details | [`WebSpider.md`](WebSpider.md) |

---

## ✅ Quick checklist (new clone)

```text
□ Copy src/backend/Omada.Api/.env.example → .env
□ Set ROBOFLOW_API_KEY (if using floorplan AI)
□ SQL: LocalDB (Development) or ConnectionStrings__DefaultConnection in .env
□ dotnet run in Omada.Api → Swagger loads at :5069
□ Copy src/frontend/mobile/.env.example → .env
□ Set EXPO_PUBLIC_API_BASE_URL (+ APP_BASE_URL for invite links on device)
□ npm run generate-api (with API running)
□ npm run start in mobile
```

---

## 📚 Related docs

| Doc | Topic |
|-----|-------|
| [`../README.md`](../README.md) | Product overview |
| [`Backend.md`](Backend.md) | API structure |
| [`Frontend.md`](Frontend.md) | Mobile structure |
| [`WebSpider.md`](WebSpider.md) | Crawling & sync |
| [`Architecture.md`](Architecture.md) | System design |
