# Backend structure guide

Reference for **`src/backend/`** — the Omada ASP.NET Core API and related projects.

**Quick start:** [`Configuration.md`](Configuration.md) · **Run:** `cd src/backend/Omada.Api`, copy `.env.example` → `.env`, `dotnet run` → Swagger at `http://localhost:5069/swagger`

---

## Projects

| Path | Role |
|------|------|
| **`Omada.Api/`** | Main REST API (in `Omada.sln`) — product backend |
| **`Omada.Web/`** | Optional Razor/MVC scaffold — **not** in main solution, not wired to the API |

All feature work happens in **`Omada.Api`**.

---

## Architecture overview

```text
Controllers  →  Services  →  Repositories / DbContext  →  SQL Server
     ↑              ↑
  DTOs +       IUserContext,
  FluentValidation   permissions, Hangfire
```

**Typical feature flow:** Entity → `Data/Configurations` → Service → Controller → DTO/Validator → Swagger → mobile `npm run generate-api`.

**API responses:** `ServiceResponse<T>` with `AppError` on failure — do not invent other envelopes.

---

## `Omada.Api` folder map

### `Abstractions/`

| Type | Role |
|------|------|
| `ServiceResponse`, `ServiceResponse<T>` | Standard API envelope |
| `AppError` | Error codes for clients |
| `IUserContext` | Current user + organization (throws when missing in auth flows) |
| `ITenantAccessor` | `OrganizationId` from JWT; **null** during seed/migrations |
| `HasPermissionAttribute` | Widget RBAC → policy `widgetKey:AccessLevel` |

### `Controllers/` (27 controllers)

Thin HTTP layer; business logic belongs in services. No broad try/catch — use exception middleware.

| Controller | Route | Primary services | Notes |
|------------|-------|------------------|--------|
| `AuthController` | `api/Auth` | `AuthService` | Login, refresh, org switch (incl. SuperAdmin enter), join via invite |
| `OrganizationsController` | `api/Organizations` | `OrganizationService` | Registration, invite preview, org by id |
| `OrganizationAdminController` | `api/Organizations/current` | `OrganizationAdminService` | Settings, members, roles, periods, enabled widgets, audit logs |
| `SuperAdminController` | `api/super-admin` | `OrganizationService`, `AuditLogService` | Platform org list/detail/delete, platform audit log |
| `AdminController` | `api/Admin` | `OrganizationAdminService` | Widget catalog (`GET widgets`) |
| `UsersController` | `api/Users` | `UserService` | Profile, directory, GDPR — `users`, `digital-id` |
| `SearchController` | `api/Search` | `SearchService` | Universal search (permission-scoped) |
| `GroupsController` | `api/Groups` | `GroupService` | `groups`, `users` |
| `ScheduleController` | `api/Schedule` | `ScheduleService` | `schedule`, `users` (hosts) |
| `EventTypesController` | `api/EventTypes` | `EventTypeService` | `schedule` |
| `NewsController` | `api/News` | `NewsService` | `news` |
| `TasksController` | `api/Tasks` | `TaskService` | `tasks` |
| `GradesController` | `api/Grades` | `GradeService` | User grades + **admin** CRUD/list |
| `AttendanceController` | `api/Attendance` | `AttendanceService` | My attendance + **admin** records |
| `ChatController` | `api/organizations/{orgId}/chat` | `ChatService` | `chat` |
| `RoomsController` | `api/Rooms` | `RoomService` | `rooms` |
| `BuildingsController` | `api/Buildings` | `MapService` | Building CRUD — `map` |
| `MapsController` | `api` | `MapService` | Floors, pins — `map` |
| `FloorplansController` | `api/floorplans` | `FloorplanProcessingService` | `map` (Admin upload) |
| `FilesController` | `api/Files` | File storage | Uploads to `wwwroot` |
| `DigitalIdController` | `api/DigitalId` | `DigitalIdService` | QR validation |
| `WebSpiderController` | `api/web-spider` | `WebSpiderAdminService`, `SpiderSyncRunService` | Schedule/news sync, history, unresolved |
| `ToolsController` | `api/Tools` | `ColorExtractionService` | Logo colors (registration) |

### `Services/` and `Services/Interfaces/`

| Service | Responsibility |
|---------|----------------|
| `AuthService` | Login, tokens, refresh, organization switch (members + SuperAdmin enter), join via invite |
| `UserService` | Profile, `WidgetAccess` (filtered by org enabled widgets), directory |
| `OrganizationService` | Org CRUD, registration, invite preview; SuperAdmin list/delete |
| `OrganizationAdminService` | Current-org admin: settings, members, roles, periods, enabled widgets |
| `AuditLogService` | Append/query admin audit entries (org + platform-wide) |
| `PermissionService` | Role ↔ widget permissions |
| `SearchService` | Universal search groups (users, news, tasks, …) with widget access checks |
| `GroupService` | Groups and members |
| `EmailService` | Invitation / onboarding emails (**mock logger today** — no real SMTP yet) |
| `ColorExtractionService` | Logo → color palette (ImageSharp) |
| `ScheduleService` | Calendar events, attendance, busy times |
| `EventTypeService` | Per-organization event types |
| `NewsService` | News items and read state |
| `TaskService` | Task items |
| `GradeService` | Grades + admin list/CRUD |
| `AttendanceService` | My attendance + admin records |
| `ChatService` | Messages + SignalR notify |
| `RoomService` | Rooms, bookings, search, amenities |
| `MapService` | Buildings, floors, pins, map CRUD |
| `FloorplanProcessingService` | Upload floorplan, Roboflow extraction, save GeoJSON |
| `FloorplanGeoJsonRoomPublishParser` | GeoJSON → room rows |
| `RoboflowFloorplanGeoJsonExtractor` | In `Services/Floorplan/` (namespace `FloorplanAi`) |
| `WebSpiderService` | HTML crawl, timetable/news parse |
| `WebSpiderAdminService` | Admin preview, discover, sync enqueue |
| `NewsSpiderSyncService` | Persist spider news into `NewsItem` (dedup by source URL/hash) |
| `ScheduleSpiderSyncService` | Persist spider data to `ScrapedClassEvent` |
| `SpiderSyncRunService` | Sync run history for admin UI |
| `SpiderUrlResolver` | Org URLs from DB, appsettings fallback |
| `ScrapedEntityResolutionService` | Host/room resolution for scraped rows |
| `GeminiService` | Optional generative fallback for spider |
| `DigitalIdService` | Short-lived QR JWT |
| `WidgetRegistry` | Dashboard widget catalog (core vs configurable) |

**Infrastructure:** `OrganizationWidgetKeys` — parse/filter org enabled widget keys for DTOs and `UserService`.

Typed `HttpClient` is used for web spider, Gemini, and Roboflow.

### `Repositories/`

`UnitOfWork`, `GenericRepository<T>`, and feature repos: `ScheduleRepository`, `NewsRepository`, `TaskRepository`, `GradeRepository`, `RoomRepository`, `ScrapedClassEventRepository`.

### `Entities/`

All inherit **`BaseEntity`** (`Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`). Mapping lives in **`Data/Configurations/`** — no data annotations on entities.

| Area | Entities |
|------|----------|
| Tenancy | `Organization`, `User`, `OrganizationMember`, `Role`, `RolePermission`, `RefreshToken` |
| Admin | `OrganizationPeriod`, `AuditLog` |
| Groups | `Group`, `GroupMember` |
| Schedule | `Event`, `EventOverride`, `EventAssociation`, `EventAttendance`, `EventType` |
| Content | `NewsItem`, `UserNewsRead`, `TaskItem`, `Grade`, `Message` |
| Map | `Building`, `Floor`, `Room`, `RoomBooking`, `RoomAmenity`, `MapPin`, `Floorplan` |
| Spider | `ScrapedClassEvent`, `SpiderSyncRun` |

**Organization fields (admin):** `EnabledWidgetKeysJson` (org widget catalog), `OnboardingStep`, `SpiderSchedulePageUrl`, `SpiderNewsStartUrl`, `IsActive`, `OrganizationType`.

**No organization filter on:** `Organization`, `User`, `OrganizationMember`, `RefreshToken`.

### `Data/`

- **`ApplicationDbContext`** — global soft-delete + tenant filters when `OrganizationId` is in context  
- **`DbInitalizer.cs`** — seed data (note filename spelling)  
- **`ApplicationDbContextFactory`** — EF design-time tooling  

### `DTOs/` and `Validators/`

Grouped by feature (`Auth`, `Schedule`, `Maps`, `Scraping`, …). Request DTOs use **FluentValidation**; response DTOs use `[Required]` where fields are always present (for OpenAPI / NSwag).

### `Infrastructure/`

| Area | Contents |
|------|----------|
| `Configuration/` | `.env` loading (`DotEnvBootstrap`) |
| `Constants/` | `WidgetKeys`, `RoleNames` — keep aligned with mobile `permissions.config.ts` |
| `Security/` | Tenant accessor, user context, permission handler |
| `Middleware/` | `ExceptionHandlingMiddleware` |
| `Hangfire/` | `ScheduleSyncJobs`, dashboard filter |
| `Scraping/` | Event hashing, HTML structure exceptions |
| `Options/` | Roboflow, Digital ID, env fallbacks for `ROBOFLOW_*` / `GEMINI_API_KEY` |
| `Grading/` | `GradePointCalculator` |
| Invite helpers | `OrganizationInviteCodeGenerator`, `InviteLinkBuilder`, `InviteEmailTemplates` |

### `Hubs/AppHub.cs`

SignalR at **`/ws/app`** — clients join organization groups after login.

### `Migrations/`

EF Core migration history. Run from `Omada.Api` with design-time factory.

### `wwwroot/`

Uploads and floorplan images under **`wwwroot/`** (served via `UseStaticFiles`). Root **`/`** redirects to **`/swagger`** in Development.

---

## Feature notes

### Authentication and organizations

- JWT includes **`OrganizationId`**; `SwitchOrg` re-issues token. **SuperAdmin** users without membership can switch into any **active** org (role `SuperAdmin` in token).
- Registration creates org, admin, roles, widgets, and unique **`InviteCode`** in one transaction.
- **`GET /api/Organizations/invite/{code}`** — public preview before join.
- **`POST /api/Auth/join`** — register or attach account via invite code.
- **`GET /api/Organizations`** (list all) — **SuperAdmin** only; tenant admins use **`/api/Organizations/current`**.

### Organization admin (`OrganizationAdminController`)

| Area | Endpoints (under `/api/Organizations/current`) |
|------|--------------------------------------------------|
| Settings | `GET` / `PUT` — name, branding, `OrganizationType`, `IsActive`, onboarding step |
| Members | `GET members`, `POST members/invite`, `PUT members/{userId}` |
| Roles | CRUD + `PUT roles/{id}/permissions` |
| Periods | CRUD academic/operational periods |
| Widgets | `PUT enabled-widgets` — org-wide catalog |
| Audit | `GET audit-logs` — paginated admin actions |
| Invite | `POST invite-code/regenerate` |

Widget catalog metadata: **`GET /api/Admin/widgets`**.

### Platform admin (`SuperAdminController`)

- `GET/DELETE /api/super-admin/organizations` — platform org list and hard delete
- `GET /api/super-admin/organizations/{id}` — org detail
- `GET /api/super-admin/audit-logs` — cross-tenant audit (optional `organizationId` filter)

### Schedule vs web spider

| Data | Table / API | Purpose |
|------|-------------|---------|
| In-app calendar | `Event` | User CRUD via `ScheduleController` |
| Scraped timetable | `ScrapedClassEvent` | Filled by spider sync (Hangfire) |

These are separate models; do not confuse them.

### Map and floorplans

- Room/pin coordinates: normalized **`[0..1]`** on floorplan images.  
- Upload: `FloorplanProcessingService` → **`RoboflowFloorplanGeoJsonExtractor`** (in-process; no separate Python service).  
- Configure **`ROBOFLOW_API_KEY`** in `.env` — see [Configuration.md](Configuration.md).  
- Entrance pins: `PinType.Exit` with label `"Entrance"`.

### Web spider

- URLs stored on **Organization** (admin UI).  
- Details: [WebSpider.md](WebSpider.md).  
- Optional **`Gemini:ApiKey`** for parse fallbacks.

### Digital ID

- Short-lived QR JWT; optional scanner API key on validate endpoint.

---

## Configuration

| File | Purpose |
|------|---------|
| `appsettings.json` | Shared defaults (model ids, empty secrets) |
| `appsettings.Development.json` | LocalDB, dev JWT key |
| `.env` | Gitignored secrets and overrides — see `.env.example` |

---

## Database

```bash
cd src/backend/Omada.Api
dotnet ef database update
```

Uses SQL Server (LocalDB by default in Development). Override connection string in `.env` if needed.

---

## After API contract changes

1. Run the API and confirm Swagger.  
2. From mobile: `cd src/frontend/mobile && npm run generate-api`  
3. Do not hand-edit `generatedClient.ts`.

---

## Adding a new backend feature

1. Entity + `Data/Configurations/{Entity}Configuration.cs`  
2. DTOs + validators  
3. Service + interface; register in `Program.cs`  
4. Controller with `[HasPermission]` and org checks in the service  
5. EF migration if schema changed  
6. Regenerate mobile client  
7. Add `WidgetKeys` + mobile `permissions.config.ts` if user-facing  

---

## Related documentation

- [Configuration.md](Configuration.md) — environment variables  
- [WebSpider.md](WebSpider.md) — crawling and sync  
- [Frontend.md](Frontend.md) — mobile client structure  
- [../README.md](../README.md) — monorepo overview  
- [../src/backend/README.md](../src/backend/README.md) — short backend entry point  
