# ⚙️ Backend Structure Guide

> The Omada ASP.NET Core API — folders, features, patterns, and how to extend it.

**Quick start:** [`Configuration.md`](Configuration.md) · **Run:** `cd src/backend/Omada.Api` → copy `.env.example` → `.env` → `dotnet run` → Swagger at `http://localhost:5069/swagger`

**See also:** [`Architecture.md`](Architecture.md) · [`Frontend.md`](Frontend.md) · [`WebSpider.md`](WebSpider.md)

---

## 🗂️ Projects

| Path | Role | Status |
|------|------|--------|
| **`Omada.Api/`** | Main REST API — all product features | ✅ Active (in `Omada.sln`) |
| **`Omada.Web/`** | Optional Razor/MVC scaffold | ❌ Not in repo / not in solution |

All feature work happens in **`Omada.Api`** (~444 source files, .NET 8).

---

## 🏗️ Architecture overview

```text
┌──────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│ Controllers  │ ──▶ │  Services    │ ──▶ │ Repositories /  │ ──▶ │ SQL Server │
│  (23 total)  │     │  (~31 svcs)  │     │ DbContext       │     │            │
└──────┬───────┘     └──────┬───────┘     └─────────────────┘     └────────────┘
       │                    │
       ▼                    ▼
   DTOs +              IUserContext,
   FluentValidation     permissions,
                        Hangfire jobs
```

**Typical feature flow:**

```text
Entity → Data/Configurations → Service → Controller → DTO/Validator → Swagger → mobile npm run generate-api
```

**API responses:** Always `ServiceResponse<T>` with `AppError` on failure — never invent other envelopes.

---

## 📁 `Omada.Api` folder map

```text
Omada.Api/
├── 📄 Program.cs              Composition root, DI, middleware pipeline
├── 📄 appsettings.json        Shared defaults
├── 📄 .env.example            Secrets template (gitignored .env)
│
├── 🧩 Abstractions/           Cross-cutting contracts (5 files)
├── 🌐 Controllers/            23 HTTP controllers
├── ⚙️ Services/               Business logic (~31 services)
│   ├── Interfaces/
│   └── Floorplan/             Roboflow AI extractor
├── 🗄️ Repositories/           Unit of Work + feature repos
├── 📦 Entities/               34 domain entity files
├── 💾 Data/
│   ├── ApplicationDbContext.cs
│   ├── ApplicationDbContextFactory.cs
│   ├── DbInitalizer.cs        (note: filename typo)
│   └── Configurations/        28 EF Fluent API configs
├── 📋 DTOs/                   122 files in 18 feature subfolders
├── ✅ Validators/             45 FluentValidation validators
├── 🔧 Infrastructure/         Security, middleware, Hangfire, options
├── 📡 Hubs/                   SignalR AppHub
├── 🔄 Migrations/             24 EF migrations + snapshot
└── 📂 wwwroot/                Static uploads, floorplan images
```

---

## 🧩 Abstractions/

| Type | Role |
|------|------|
| `ServiceResponse`, `ServiceResponse<T>` | Standard `{ isSuccess, data, error }` envelope |
| `AppError` | Error codes (`AUTH_001`, `DATA_404`, …) |
| `IUserContext` | Current user + org — **throws** when missing in auth flows |
| `ITenantAccessor` | `OrganizationId` from JWT; **null** during seed/migrations |
| `HasPermissionAttribute` | `[HasPermission(widgetKey, nameof(AccessLevel.View))]` → policy `widget:Level` |

---

## 🌐 Controllers/ (23 controllers)

Thin HTTP layer — business logic lives in services. No broad try/catch (use exception middleware).

| Controller | Route | Primary services | Widget(s) |
|------------|-------|------------------|-----------|
| 🔑 `AuthController` | `api/Auth` | `AuthService` | — (public + auth) |
| 🏢 `OrganizationsController` | `api/Organizations` | `OrganizationService` | — |
| 🛡️ `OrganizationAdminController` | `api/Organizations/current` | `OrganizationAdminService` | `admin` |
| 🌐 `SuperAdminController` | `api/super-admin` | `OrganizationService`, `AuditLogService` | `super-admin` |
| 📋 `AdminController` | `api/Admin` | `OrganizationAdminService` | `admin` |
| 👤 `UsersController` | `api/Users` | `UserService` | `users`, `profile` |
| 🔍 `SearchController` | `api/Search` | `SearchService` | permission-scoped |
| 👥 `GroupsController` | `api/Groups` | `GroupService` | `groups` |
| 📅 `ScheduleController` | `api/Schedule` | `ScheduleService` | `schedule` |
| 🏷️ `EventTypesController` | `api/EventTypes` | `EventTypeService` | `schedule` |
| 📰 `NewsController` | `api/News` | `NewsService` | `news` |
| ✅ `TasksController` | `api/Tasks` | `TaskService` | `tasks` |
| 📊 `GradesController` | `api/Grades` | `GradeService` | `grades` |
| 📋 `AttendanceController` | `api/Attendance` | `AttendanceService` | `attendance` |
| 💬 `ChatController` | `api/organizations/{orgId}/chat` | `ChatService` | `chat` |
| 🚪 `RoomsController` | `api/Rooms` | `RoomService` | `rooms` |
| 🏗️ `BuildingsController` | `api/Buildings` | `MapService` | `map` |
| 🗺️ `MapsController` | `api` | `MapService` | `map` |
| 📐 `FloorplansController` | `api/floorplans` | `FloorplanProcessingService` | `map` (Admin upload) |
| 📎 `FilesController` | `api/Files` | File storage | — |
| 🪪 `DigitalIdController` | `api/DigitalId` | `DigitalIdService` | `digital-id` |
| 🕷️ `WebSpiderController` | `api/web-spider` | `WebSpiderAdminService`, `SpiderSyncRunService` | `admin` |
| 🎨 `ToolsController` | `api/Tools` | `ColorExtractionService` | — (registration) |

---

## ⚙️ Services/ (~31 services)

| Service | Responsibility |
|---------|----------------|
| 🔑 `AuthService` | Login, tokens, refresh, org switch, join via invite |
| 👤 `UserService` | Profile, `WidgetAccess`, directory |
| 🏢 `OrganizationService` | Org CRUD, registration, SuperAdmin list/delete |
| 🛡️ `OrganizationAdminService` | Current-org admin: settings, members, roles, periods, widgets |
| 📝 `AuditLogService` | Admin audit append/query (org + platform) |
| 🔐 `PermissionService` | Role ↔ widget permissions |
| 🔍 `SearchService` | Universal search with widget access checks |
| 👥 `GroupService` | Groups and members |
| 📧 `EmailService` | Invitation emails (**mock logger today**) |
| 🎨 `ColorExtractionService` | Logo → color palette (ImageSharp) |
| 📅 `ScheduleService` | Calendar events, attendance, busy times |
| 🏷️ `EventTypeService` | Per-org event types |
| 📰 `NewsService` | News items and read state |
| ✅ `TaskService` | Task items |
| 📊 `GradeService` | Grades + admin CRUD |
| 📋 `AttendanceService` | My attendance + admin records |
| 💬 `ChatService` | Messages + SignalR notify |
| 🚪 `RoomService` | Rooms, bookings, search, amenities |
| 🗺️ `MapService` | Buildings, floors, pins |
| 📐 `FloorplanProcessingService` | Upload floorplan, Roboflow extraction, GeoJSON |
| 📐 `FloorplanGeoJsonRoomPublishParser` | GeoJSON → room rows |
| 🤖 `RoboflowFloorplanGeoJsonExtractor` | In `Services/Floorplan/` — AI room detection |
| 🕷️ `WebSpiderService` | HTML crawl, timetable/news parse |
| 🕷️ `WebSpiderAdminService` | Admin preview, discover, sync enqueue |
| 📰 `NewsSpiderSyncService` | Spider news → `NewsItem` (dedup by URL/hash) |
| 📅 `ScheduleSpiderSyncService` | Spider data → `ScrapedClassEvent` |
| 📊 `SpiderSyncRunService` | Sync run history for admin UI |
| 🔗 `SpiderUrlResolver` | Org URLs from DB, appsettings fallback |
| 🎯 `ScrapedEntityResolutionService` | Host/room resolution for scraped rows |
| ✨ `GeminiService` | Optional generative fallback for spider |
| 🪪 `DigitalIdService` | Short-lived QR JWT |
| 🧩 `WidgetRegistry` | Dashboard widget catalog (core vs configurable) |

**Infrastructure helper:** `OrganizationWidgetKeys` — parse/filter org enabled widget keys.

Typed `HttpClient` for web spider, Gemini, and Roboflow.

---

## 🗄️ Repositories/

| Type | Role |
|------|------|
| `UnitOfWork` | Per-request; lazy `Repository<T>()` + `CompleteAsync()` |
| `GenericRepository<T>` | Generic EF CRUD |
| Feature repos | `ScheduleRepository`, `NewsRepository`, `TaskRepository`, `GradeRepository`, `RoomRepository`, `ScrapedClassEventRepository` |

Many services use `_uow.Repository<T>()` directly.

---

## 📦 Entities/ (34 files)

All inherit **`BaseEntity`**: `Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`. Mapping in **`Data/Configurations/`** — no data annotations on entities.

| Area | Entities |
|------|----------|
| 🏢 Tenancy | `Organization`, `User`, `OrganizationMember`, `Role`, `RolePermission`, `RefreshToken` |
| 🛡️ Admin | `OrganizationPeriod`, `AuditLog` |
| 👥 Groups | `Group`, `GroupMember` |
| 📅 Schedule | `Event`, `EventOverride`, `EventAssociation`, `EventAttendance`, `EventType` |
| 📰 Content | `NewsItem`, `UserNewsRead`, `TaskItem`, `Grade`, `Message` |
| 🗺️ Map | `Building`, `Floor`, `Room`, `RoomBooking`, `RoomAmenity`, `MapPin`, `Floorplan` |
| 🕷️ Spider | `ScrapedClassEvent`, `SpiderSyncRun`, `SpiderSyncKind`, `SpiderSyncStatus` |
| 🔧 Infra | `BaseEntity`, `IOrganizationScoped`, `Enums.cs` |

**Organization admin fields:** `EnabledWidgetKeysJson`, `OnboardingStep`, `SpiderSchedulePageUrl`, `SpiderNewsStartUrl`, `IsActive`, `OrganizationType`, `InviteCode`

**No org filter on:** `Organization`, `User`, `OrganizationMember`, `RefreshToken`

---

## 💾 Data/

| File | Role |
|------|------|
| `ApplicationDbContext` | DbSets, global soft-delete + tenant filters |
| `DbInitalizer.cs` | Idempotent demo seed when DB is empty |
| `ApplicationDbContextFactory` | Design-time EF (`dotnet ef`) with null tenant |

**Startup:** `MigrateAsync()` + `DbInitializer.SeedAsync()` on boot.

---

## 📋 DTOs/ (18 subfolders)

`Attendance`, `Auth`, `Chat`, `Common`, `DigitalId`, `Files`, `Grades`, `Groups`, `Import`, `Maps`, `News`, `Organizations`, `Rooms`, `Schedule`, `Scraping`, `Search`, `Tasks`, `Users`

- **Requests** → FluentValidation in `Validators/`
- **Responses** → `[Required]` on always-present fields (OpenAPI / NSwag)

---

## 🔧 Infrastructure/

| Area | Contents |
|------|----------|
| `Configuration/` | `.env` loading (`DotEnvBootstrap`) |
| `Constants/` | `WidgetKeys`, `RoleNames` — align with mobile |
| `Security/` | Tenant accessor, user context, permission handler |
| `Middleware/` | `ExceptionHandlingMiddleware` |
| `Hangfire/` | `ScheduleSyncJobs`, dashboard filter |
| `Scraping/` | Event hashing, HTML structure exceptions |
| `Options/` | Roboflow, Digital ID, env fallbacks |
| `Grading/` | `GradePointCalculator` |
| Invite helpers | `OrganizationInviteCodeGenerator`, `InviteLinkBuilder`, `InviteEmailTemplates` |

---

## 📡 SignalR — `Hubs/AppHub.cs`

- Endpoint: **`/ws/app`**
- Clients call `JoinOrganization(organizationId)` after login
- Used by `ChatService` for real-time message notifications

---

## 🔄 Migrations (24 total)

```bash
cd src/backend/Omada.Api
dotnet ef database update
```

| Theme | Examples |
|-------|----------|
| 🏗️ Foundation | `InitialCreate`, map/rooms/floors |
| 🕷️ Spider | `AddScrapedClassEvents`, `AddOrganizationSpiderUrls`, `AddSpiderSyncRunsAndNewsSourceUrl` |
| 📊 Features | `AddGrades`, `ExpandTaskItem`, `AddFloorplans`, `AddOrganizationPeriodsPhase3` |
| 👤 Users | `UserProfilePreferencesAndGdpr`, `AddUsersDirectoryOrgChart` |

---

## 🎯 Feature deep dives

### 🔑 Authentication & organizations

- JWT includes **`OrganizationId`**; `SwitchOrg` re-issues token
- **SuperAdmin** can enter any **active** org without membership
- Registration creates org + admin + roles + widgets + invite code in one transaction
- **`GET /api/Organizations/invite/{code}`** — public preview before join
- **`POST /api/Auth/join`** — register or attach account via invite code

### 🛡️ Organization admin (`/api/Organizations/current`)

| Area | Endpoints |
|------|-----------|
| ⚙️ Settings | `GET` / `PUT` — name, branding, type, active, onboarding |
| 👥 Members | `GET members`, `POST members/invite`, `PUT members/{userId}` |
| 🔐 Roles | CRUD + `PUT roles/{id}/permissions` |
| 📅 Periods | CRUD academic/operational periods |
| 🧩 Widgets | `PUT enabled-widgets` — org-wide catalog |
| 📝 Audit | `GET audit-logs` — paginated admin actions |
| 🔗 Invite | `POST invite-code/regenerate` |

Widget catalog metadata: **`GET /api/Admin/widgets`**

### 📅 Schedule vs web spider

| Data | Table | Purpose |
|------|-------|---------|
| In-app calendar | `Event` | User CRUD via `ScheduleController` |
| Scraped timetable | `ScrapedClassEvent` | Filled by spider sync (Hangfire) |

> ⚠️ These are **separate models** — do not confuse them!

### 🗺️ Map & floorplans

- Room/pin coordinates: normalized **`[0..1]`** on floorplan images
- Upload → `FloorplanProcessingService` → **`RoboflowFloorplanGeoJsonExtractor`**
- Configure **`ROBOFLOW_API_KEY`** in `.env`
- Entrance pins: `PinType.Exit` with label `"Entrance"`

### 🕷️ Web spider

- URLs on **Organization** (admin UI)
- Details: [`WebSpider.md`](WebSpider.md)
- Optional **`GEMINI_API_KEY`** for parse fallbacks

---

## ➕ Adding a new backend feature

```text
1. 📝 Entity + Data/Configurations/{Entity}Configuration.cs
2. 📋 DTOs + Validators/
3. ⚙️ Service + interface → register in Program.cs
4. 🌐 Controller + [HasPermission] + org checks in service
5. 🗄️ EF migration if schema changed
6. 📖 Confirm Swagger
7. 🔄 npm run generate-api (mobile)
8. 🧩 Add WidgetKeys + mobile permissions.config.ts if user-facing
```

---

## 📚 Related documentation

| Doc | Topic |
|-----|-------|
| [`Architecture.md`](Architecture.md) | System design & data flow |
| [`Configuration.md`](Configuration.md) | Environment variables |
| [`WebSpider.md`](WebSpider.md) | Crawling & sync |
| [`Frontend.md`](Frontend.md) | Mobile client structure |
| [`../README.md`](../README.md) | Monorepo overview |
