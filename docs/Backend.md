# ⚙️ Backend Structure Guide

> The Omada ASP.NET Core API — folders, features, patterns, and how to extend it.

**Quick start:** [`Configuration.md`](Configuration.md) · **Run:** `cd src/backend/Omada.Api` → copy `.env.example` → `.env` → `dotnet run` → Swagger at `http://localhost:5069/swagger`

**See also:** [`Architecture.md`](Architecture.md) · [`Frontend.md`](Frontend.md) · [`WebSpider.md`](WebSpider.md) · [`AccountSecurity.md`](AccountSecurity.md) · [`Announcements.md`](Announcements.md) · [`CurriculumOfferings.md`](CurriculumOfferings.md) · [`Timetables.md`](Timetables.md) · [`Coursework.md`](Coursework.md) · [`Grades.md`](Grades.md)

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
│  (25 total)  │     │  (~33 svcs)  │     │ DbContext       │     │            │
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

**EF Core concurrency:** A scoped **`ApplicationDbContext`** is not thread-safe. Do not run parallel queries on the same instance (`Task.WhenAll` over one injected `_context`). For parallel per-domain work, use **`IServiceScopeFactory.CreateAsyncScope()`** and resolve a fresh context per task — see **Universal search** below and **`SearchService`**.

---

## 📁 `Omada.Api` folder map

```text
Omada.Api/
├── 📄 Program.cs              Composition root, DI, middleware pipeline
├── 📄 appsettings.json        Shared defaults
├── 📄 .env.example            Secrets template (gitignored .env)
│
├── 🧩 Abstractions/           Cross-cutting contracts (5 files)
├── 🌐 Controllers/            25 HTTP controllers
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

## 🌐 Controllers/ (25 controllers)

Thin HTTP layer — business logic lives in services. No broad try/catch (use exception middleware).

| Controller | Route | Primary services | Widget(s) |
|------------|-------|------------------|-----------|
| 🔑 `AuthController` | `api/Auth` | `AuthService` | — (public + auth: login, refresh, join, **forgot/reset password**, **verify/resend 2FA**) |
| 🏢 `OrganizationsController` | `api/Organizations` | `OrganizationService` | — |
| 🛡️ `OrganizationAdminController` | `api/Organizations/current` | `OrganizationAdminService` | `admin` |
| 🌐 `SuperAdminController` | `api/super-admin` | `OrganizationService`, `AuditLogService` | `super-admin` |
| 📋 `AdminController` | `api/Admin` | `OrganizationAdminService` | `admin` |
| 👤 `UsersController` | `api/Users` | `UserService` | `users`, `profile` — **change password**, **security (2FA toggle)**, export, delete |
| 🔍 `SearchController` | `api/Search` | `SearchService` | permission-scoped |
| 👥 `GroupsController` | `api/Groups` | `GroupService` | `groups` |
| 📅 `ScheduleController` | `api/Schedule` | `ScheduleService` | `schedule` |
| 🏷️ `EventTypesController` | `api/EventTypes` | `EventTypeService` | `schedule` |
| 📰 `NewsController` | `api/News` | `NewsService` | `news` (legacy — member UI merged into announcements) |
| 📣 `AnnouncementsController` | `api/announcements` | `AnnouncementService` | `announcements` — channels, posts, comments, read cursors, SignalR |
| ✅ `TasksController` | `api/Tasks` | `TaskService` | `tasks` — personal tasks + **coursework batches**, `PATCH /submission` (View), batch grade (Edit) |
| 📊 `GradesController` | `api/Grades` | `GradeService` | Formal transcript — `grades` widget (`/me`, admin CRUD) |
| 📋 `AttendanceController` | `api/Attendance` | `AttendanceService` | `attendance` |
| 💬 `ChatController` | `api/organizations/{orgId}/chat` | `ChatService` | `chat` (legacy — merged into announcements) |
| 🚪 `RoomsController` | `api/Rooms` | `RoomService` | `rooms` |
| 🏗️ `BuildingsController` | `api/Buildings` | `MapService` | `map` |
| 🗺️ `MapsController` | `api` | `MapService` | `map` |
| 📐 `FloorplansController` | `api/floorplans` | `FloorplanProcessingService` | `map` (Admin upload) |
| 📎 `FilesController` | `api/Files` | File storage | Avatars, news, coursework (not org document library) |
| 📁 `DocumentsController` | `api/Documents` | `OrganizationDocumentService` | Corporate file library — see [`Documents.md`](Documents.md) |
| 🪪 `DigitalIdController` | `api/DigitalId` | `DigitalIdService` | `digital-id` |
| 🕷️ `WebSpiderController` | `api/web-spider` | `WebSpiderAdminService`, `SpiderSyncRunService` | `admin` |
| 🎨 `ToolsController` | `api/Tools` | `ColorExtractionService` | `POST extract-colors` — multipart `file`; used by register + branding workspace |
| 📚 `OfferingPackagesAdminController` | `api/Organizations/current/offering-packages` | `CourseOfferingPackageService` | **Org Admin** — curriculum packages, apply/revert |
| 🎓 `CourseOfferingsAdminController` | `api/Organizations/current/periods/{periodId}/offerings` | `CourseOfferingService`, **`OfferingTimetableService`** (per-offering publish) | **Org Admin** for CRUD + publish; **`tasks`** View/Edit for **grade-plan** on teaching team |
| 📅 `PeriodTimetableAdminController` | `api/Organizations/current/periods/{periodId}` | **`OfferingTimetableService`**, **`ScheduleService`** | **Org Admin** — preview, publish status, bulk publish, member schedule preview |
| 🎓 `OfferingsController` | `api/Offerings` | `CourseOfferingService`, **`GradebookService`** | `tasks` View — periods, assignable, my enrollments; **`tasks` Edit** — gradebook + student breakdown |

---

## ⚙️ Services/ (~31 services)

| Service | Responsibility |
|---------|----------------|
| 🔑 `AuthService` | Login, tokens, refresh, org switch, join via invite, **forgot/reset password**, **email OTP 2FA** (login challenge + verify/resend) |
| 👤 `UserService` | Profile, `WidgetAccess`, directory, **change password**, **security settings (2FA toggle)**, export, delete |
| 🏢 `OrganizationService` | Org CRUD, registration, SuperAdmin list/delete |
| 🛡️ `OrganizationAdminService` | Current-org admin: settings, members, roles, periods, widgets |
| 📚 `CourseOfferingPackageService` | Curriculum packages: CRUD, save items, apply/revert to period |
| 🎓 `CourseOfferingService` | Term offerings, enrollments, cohort/program enroll, rollover |
| 📅 `OfferingTimetableService` | Weekly session plan preview, host/cohort/room conflicts, publish → **`Event`**, bulk publish, expected attendance seed |
| 📊 `GradebookService` | Teacher roster + per-student coursework breakdown (1–10 scale) |
| 📝 `AuditLogService` | Admin audit append/query (org + platform) |
| 🔐 `PermissionService` | Role ↔ widget permissions |
| 🔍 `SearchService` | Universal search with widget access checks; **`IServiceScopeFactory`** — separate scoped **`ApplicationDbContext`** per result bucket |
| 👥 `GroupService` | Hierarchical groups, type catalog, membership, assignable picker, departments |
| 📧 `EmailService` | Brevo transactional email — invites, **password reset**, **2FA sign-in codes** (console log when Brevo unset) |
| 🎨 `ColorExtractionService` | Logo → color palette (ImageSharp) |
| 📅 `ScheduleService` | Calendar events, attendance, busy times; **`GetScheduleForUserAsync`** for admin member-schedule preview |
| 🏷️ `EventTypeService` | Per-org event types |
| 📰 `NewsService` | News items and read state (legacy API — member UI merged into announcements) |
| 📣 `AnnouncementService` | Channels (General/Group/CourseOffering), posts, comments, read cursors, SignalR broadcast |
| ✅ `TaskService` | Task items, assignment batches, submissions list, student **`PATCH` submission**, teaching-team grade updates |
| 📐 `OfferingGradePlanService` | Per-offering grade categories — **host-only** save |
| 🔐 `OfferingTeachingAuthorization` | Host / instructor / org-admin checks for coursework |
| 📊 `GradeService` | Grades + admin CRUD |
| 📋 `AttendanceService` | My attendance + admin records; **`RecordMemberAttendanceAsync`** (staff scan follow-up / manual roll) |
| 💬 `ChatService` | Messages + SignalR notify (legacy — merged into announcements) |
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
| 🪪 `DigitalIdService` | Member pass (`DigitalIdDto`), external `validate`, in-app staff `scan` |
| 🧩 `WidgetRegistry` | Widget metadata: core shell, always-on (schedule/tasks/digital-id), org-catalog toggles, org-type audience |

**Infrastructure helper:** `OrganizationWidgetKeys` — parse/filter catalog keys, merge always-on widgets, org-type audience (`MatchesAudience`), role permission eligibility (`IsPermissionAllowedForOrg`).

**Catalog tiers (`WidgetRegistry`):**

| Flag | Meaning | Examples |
|------|---------|----------|
| `IsCoreFeature` | Platform shell; hidden from catalog/role toggles | profile, settings, admin |
| `IsAlwaysEnabled` | Always in effective enabled set; not in catalog toggles | schedule, tasks, digital-id |
| `IsInOrgCatalog` | Admin can enable/disable org-wide | announcements, map, rooms, … |
| `Audience` | University / corporate / all | grades · documents · shared (coursework = always-on **`tasks`**) |

Removed from registry (not member widgets): **events**, **transport**, **finance**. **Groups**: role permissions + admin API only (`IsInOrgCatalog: false`).

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
| 📚 Offerings | `CourseOfferingPackage`, `CourseOfferingPackageProgram`, `CourseOfferingPackageItem`, `CourseOfferingPackageItemProgram`, `CourseOffering`, `OfferingEnrollment` |
| 👥 Groups | `Group`, `GroupMember` |
| 📅 Schedule | `Event`, `EventOverride`, `EventAssociation`, `EventAttendance`, `EventType` |
| 📰 Content | `NewsItem`, `UserNewsRead`, `TaskItem`, `Grade`, `Message`, `OrganizationDocument` |
| 🗺️ Map | `Building`, `Floor`, `Room`, `RoomBooking`, `RoomAmenity`, `MapPin`, `Floorplan` |
| 🕷️ Spider | `ScrapedClassEvent`, `SpiderSyncRun`, `SpiderSyncKind`, `SpiderSyncStatus` |
| 🔧 Infra | `BaseEntity`, `IOrganizationScoped`, `Enums.cs` |

**Organization admin fields:** `EnabledWidgetKeysJson`, `OnboardingStep`, **`OnboardingCompletedStepsJson`**, `SpiderSchedulePageUrl`, `SpiderNewsStartUrl`, `IsActive`, `OrganizationType`, `InviteCode`

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

`Attendance`, `Auth`, `Chat`, `Common`, `DigitalId`, **`Documents`**, `Files`, `Grades`, `Groups`, `Import`, `Maps`, `News`, `Offerings`, `Organizations`, `Rooms`, `Schedule`, `Scraping`, `Search`, `Tasks`, `Users`

- **Requests** → FluentValidation in `Validators/`
- **Responses** → `[Required]` on always-present fields (OpenAPI / NSwag)

---

## 🔧 Infrastructure/

| Area | Contents |
|------|----------|
| `Configuration/` | `.env` loading (`DotEnvBootstrap`) |
| `Constants/` | `WidgetKeys`, `RoleNames` (`Admin`, `Member`, `Unassigned`), `RoleResolution` — align with mobile |
| `Security/` | Tenant accessor, user context, permission handler |
| `Middleware/` | `ExceptionHandlingMiddleware` |
| `Hangfire/` | `ScheduleSyncJobs`, dashboard filter |
| `Scraping/` | Event hashing, HTML structure exceptions |
| `Options/` | Roboflow, Digital ID, env fallbacks |
| `Grading/` | `GradePointCalculator` |
| Invite helpers | `OrganizationInviteCodeGenerator`, `InviteLinkBuilder`, `InviteEmailTemplates` |
| Onboarding | **`OrganizationOnboardingProgress.cs`** — step ids in **`OnboardingCompletedStepsJson`** |
| Widget catalog | **`OrganizationWidgetKeys.cs`** — **`null` JSON** = legacy all catalog enabled; **`"[]"`** = no optional widgets (new registrations) |
| Schedule visibility | **`ScheduleUserVisibilityContext.cs`**, **`EventAudienceHelper.cs`** — member **My schedule** for published offering events |
| Session plans | **`OfferingSessionPlanJson.cs`** — weekly pattern JSON on **`CourseOffering`** |

---

## 📡 SignalR — `Hubs/AppHub.cs`

- Endpoint: **`/ws/app`**
- Clients call **`JoinOrganization(organizationId)`** after connect — adds connection to org group
- **`AnnouncementService`** broadcasts **`announcement_post`** and **`announcement_comment`** to the org group
- Legacy **`ChatService`** still uses the hub for message notifications
- **CORS:** explicit origins + **`AllowCredentials`** — **`CorsOriginPolicy`** (required for negotiate with JWT)

Full mobile lifecycle (background pause, foreground reconnect): [`Announcements.md`](Announcements.md).

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

**Invite preview & join**

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/Organizations/invite/{code}` | Public | Preview org (+ email-specific hints when `email` query provided) |
| `GET /api/Auth/invite/{code}/preview` | Bearer | Preview for logged-in user (pending invite, already member) |
| `POST /api/Auth/join` | Public | Register new user for email invite (returns org name + email, no tokens) |
| `POST /api/Auth/join/current-user` | Bearer | Open code join → `JoinWithCodeResultDto` (`PendingApproval` \| `Joined` + optional session) |
| `GET /api/Auth/invite/pending` | Bearer | Email invites awaiting accept (excludes code-approval requests) |
| `POST /api/Auth/invite/accept` | Bearer | Activate email invite membership |
| `POST /api/Auth/invite/decline` | Bearer | Remove pending email invite |

**`OrganizationMember` flags**

| `IsActive` | `RequiresAdminApproval` | Meaning |
|------------|-------------------------|---------|
| false | false | Email invite sent — waiting for user accept |
| false | true | User submitted org code — waiting for admin approve + role |
| true | false | Active member |

Migration: **`RequiresAdminApproval`** on `OrganizationMembers`.

**Account security** — full reference: [`AccountSecurity.md`](AccountSecurity.md)

| Flow | Endpoint | Notes |
|------|----------|-------|
| Change password (logged in) | `POST /api/Users/me/change-password` | Verifies current password; revokes refresh tokens |
| Forgot password | `POST /api/Auth/forgot-password` | Generic response (no enumeration); emails reset link |
| Reset password | `POST /api/Auth/reset-password` | Token purpose must not be `invite`; revokes refresh tokens |
| 2FA at sign-in | `POST /api/Auth/login` → `verify-2fa` / `resend-2fa` | When `IsTwoFactorEnabled`: 6-digit email code, 10 min |
| 2FA toggle | `PUT /api/Users/security` | Sets `IsTwoFactorEnabled`; clears pending challenge when off |

**User fields:** `PasswordResetTokenPurpose` (`invite` \| `reset`), `TwoFactorPendingSessionToken`, `TwoFactorCode`, `TwoFactorCodeExpires`. **Migrations:** `AddPasswordResetTokenPurpose`, `AddTwoFactorLoginChallenge` (applied on API startup).

**Reset links:** `{AppConfig:PublicAppUrl}/reset-password?email=&token=` — set LAN Expo URL on device testing.

### 🛡️ Organization admin (`/api/Organizations/current`)

| Area | Endpoints |
|------|-----------|
| ⚙️ Settings | `GET` / `PUT` — name, short name, branding colors/logo, type, active, onboarding (admin UI: no email-domain editor) |
| 👥 Members | `GET members` (`?roleId=`), `POST members/invite`, `PUT members/{userId}`, `DELETE members/{userId}` |
| 🔐 Roles | CRUD + `PUT roles/{id}/permissions`; **`DELETE`** reassigns members to holding role (see below) |
| 📅 Periods | CRUD academic/operational periods |
| 🧩 Widgets | `PUT enabled-widgets` — org-wide catalog (toggleable keys only; always-on widgets merged server-side) |
| 📝 Audit | `GET audit-logs` — paginated admin actions |
| 🔗 Invite | `POST invite-code/regenerate` |

Widget catalog metadata: **`GET /api/Admin/widgets`** — returns assignable widgets for the current org type; DTO includes `isAlwaysEnabled`, `isInOrgCatalog`, `isEnabledForOrganization`.

**Role delete & holding roles**

- **`RoleResolution`** (`Infrastructure/RoleResolution.cs`) — shared join/default logic and holding-role selection.
- **`RoleNames`** — `Admin` (protected), `Member`, `Unassigned` (holding bucket when custom roles are removed).
- On **`DELETE .../roles/{id}`**: if members are assigned, move them to existing **Unassigned** → else **Member** → else **create Unassigned** (or **Member** when deleting Unassigned). Uses **`ExecuteUpdateAsync`** on `OrganizationMembers`. Does **not** reassign to other custom roles. **Admin** role cannot be deleted. Audit action: `role.delete`.

### 📅 Schedule vs web spider vs native timetables

| Data | Table | Purpose |
|------|-------|---------|
| In-app calendar | `Event` | Member **Schedule**; CRUD + published offering sessions |
| Weekly pattern (draft) | `CourseOffering.WeeklySessionPlanJson` | Admin build tab — not visible to members until publish |
| Scraped timetable | `ScrapedClassEvent` | Filled by spider sync (Hangfire) — reference only |

> ⚠️ **`Event`** and **`ScrapedClassEvent`** are **separate models**. Native **publish** (`OfferingTimetableService`) writes **`Event`**; spider does not replace that flow.

**Member Schedule visibility** — `ScheduleRepository` + **`ScheduleUserVisibilityContext`** / **`EventAudienceHelper`**: host, teaching team, group/cohort membership, offering enrollment + audience JSON, enrollment cohort ids, expected/added attendance. Admin mirror: **`POST .../periods/{periodId}/member-schedule-preview`**.

See [`Timetables.md`](Timetables.md).

### 📅 Organization periods (`GET/POST/PUT/DELETE .../periods`)

Per-org **reporting windows** (`OrganizationPeriod`: name, start/end, optional `IsCurrent`). Same model for universities and corporates — UI copy differs on mobile (`getPeriodCopy`), not the schema.

| Usage today | How |
|-------------|-----|
| Org admin **`/periods-workspace`** | CRUD + **set current** via **`updatePeriod`**; onboarding step 7 |
| Member Grades widget | May group/filter by **`Grade.semester`** string (free text, not FK to period) |
| Schedule / attendance | **`Event.PeriodId`**, **`OfferingId`** from timetable publish; expected attendance seeded on publish |

Only one period may be **`IsCurrent`** per org (`OrganizationAdminService.ClearCurrentPeriodFlagAsync`). Grades/attendance **admin workspaces** are not routed in mobile org admin — periods are standalone org config.

### 👥 Groups (`/api/Groups`)

Hierarchical org structure for universities (faculty → … → class) and corporates (division → … → squad). **`Group`**: `Name`, `Type` (lowercase key), `ParentGroupId`, optional `ManagerId`, `ScheduleConfig`. **`GroupMember`**: user ↔ group link with optional `RoleInGroup`.

| Endpoint | Permission | Notes |
|----------|------------|-------|
| `GET tree` | groups **View** | Nested **`GroupTreeNodeDto`** for admin tree |
| `GET types` | groups **View** | Org-type catalog from **`GroupTypes.GetCatalog`** |
| `GET {id}` | groups **View** | Detail + direct child summaries |
| `POST` / `PUT {id}` | groups **Edit** | Validate parent (no cycles); normalize type |
| `DELETE {id}` | groups **Admin** | Recursive soft-delete of group + descendants |
| `GET {id}/members` | groups **View** | Paged + optional `q` search |
| `POST {id}/members` | groups **Edit** | Bulk add |
| `DELETE {id}/members/{userId}` | groups **Edit** | Remove one |
| `POST members/move` | groups **Edit** | Bulk move between groups |
| `GET assignable` | authenticated | Membership-scoped picker (schedule, grades, …) |
| `GET departments` | users **View** | Top-level department-like groups for directory |

**Constants:** **`Infrastructure/Constants/GroupTypes.cs`** — `UniversityCatalog` vs `CorporateCatalog`; hierarchy is always **`ParentGroupId`**, not type alone.

**Service:** `GroupService` — tenant-scoped via **`IUserContext`**; invalidate-friendly reads for admin UI.

### 🏷️ Event types (`/api/EventTypes`)

Per-org categories (Lecture, Lab, Meeting, …) with **`Name`** + **`ColorHex`**. Used by schedule events and room booking filters.

| Method | Permission | Notes |
|--------|------------|-------|
| `GET` | schedule **View** | List for org |
| `POST` / `PUT` | schedule **Edit** | `CreateEventTypeRequest` — name max 50, valid hex |
| `DELETE` | schedule **Admin** | Fails with **`IN_USE`** if referenced |

**References (delete blocked via `OnDelete(Restrict)`):**

- **`Event.EventTypeId`** — agenda color falls back: event `ColorHex` → type color → default blue
- **`RoomAllowedEventTypes`** — M2M; rooms only appear for compatible types in **`EventModal`** / **`RoomBookingModal`**

**Service:** `EventTypeService` — duplicate name check per org on create.

### 🗺️ Map, locations, floorplans & rooms

**Hierarchy:** `Building` (location) → `Floor` (level) → `Room`; optional **`Floorplan`** (1:1 per floor) with image + GeoJSON.

| Layer | Storage | Consumer |
|-------|---------|----------|
| **Campus / outdoor** | `Building.Latitude`, `Building.Longitude` (WGS84) | Member campus map — markers only when both coords set |
| **Indoor floorplan** | `Room.CoordinateX/Y`, `MapPin` — normalized **`[0..1]`** | Floorplan viewer, room overlays, entrance pins |

**Admin API**

- Building CRUD: **`BuildingsController`** / **`MapsController`** — name, address, short code, lat/lng.
- Create floor: **`POST /api/buildings/{id}/floors`** — multipart **`LevelNumber`** + optional **`FloorplanFile`** (level without image allowed). **`MapService.CreateFloorForBuildingAsync`**.
- Create room: **`POST /api/Rooms`** returns **`Ok(ServiceResponse)`** (HTTP **200**, not 201) — NSwag client expects 200.
- Floorplan upload / GeoJSON: **`FloorplansController`** → **`FloorplanProcessingService`** → **`RoboflowFloorplanGeoJsonExtractor`** (requires **`ROBOFLOW_API_KEY`**).
- Publish polygons: **`FloorplanGeoJsonRoomPublishParser`** → bookable **`Room`** rows; **`RoomAllowedEventTypes`** on floorplan Rooms tab.

**Permissions:** building/floor → **`map`** widget; room list CRUD → **`rooms` Edit**; floorplan AI upload → **`map` Admin**.

**Room admin (mobile/web):** **`/floorplan-workspace`** only — list rooms on levels without floorplan; floorplan editor for GeoJSON, pins, publish, and event types. No separate rooms admin route.

Details: **`.cursor/rules/domain-map-rooms-admin.mdc`**

### 🔍 Universal search

Cross-widget org search for members — permission-scoped, grouped by domain.

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/Search` — `[Authorize]` |
| **Query** | `Q` (required), optional `Types[]`, `LimitPerType` (default 8, max 20), `Page`, `PageSize` |
| **Buckets** | `users`, `rooms`, `news`, `tasks`, `schedule`, `groups`, `grades`, **`documents`** (corporate orgs only) (`DTOs/Search/SearchTypes.cs`) |
| **Response** | `UniversalSearchResponse` → `SearchResultGroupDto[]` with `SearchHitDto` (`title`, `subtitle`, `imageUrl`, `route`) |
| **Permissions** | Current org role widget access — only types with **view+** are searched; SuperAdmin bypass |
| **Implementation** | **`SearchService`** — **`IServiceScopeFactory.CreateAsyncScope()`** per bucket so parallel domain queries never share one **`ApplicationDbContext`** (EF Core is not thread-safe) |

**Mobile:** `searchApi.search` · hook **`useUniversalSearch`** · route **`/(app)/(modals)/search`** · dashboard **`SearchBar`** opens search modal.

### 🪪 Digital ID

- **Pass:** `GET /api/Users/me/digital-id` — `digital-id` View; `DigitalIdDto` with org branding + rotating `QrToken` (~60s JWT) + `barcodeValue`
- **External validate:** `POST /api/DigitalId/validate` — anonymous; optional `X-Scanner-Key` when `DigitalIdOptions.ScannerApiKey` is set
- **In-app staff scan:** `POST /api/DigitalId/scan` — `attendance` Edit or `digital-id` Edit → `DigitalIdScanResultDto`
- **Attendance:** `POST /api/Attendance/record` — `RecordMemberAttendanceRequest`; staff marks another member present
- **Options:** `DigitalIdOptions` — `TokenLifetimeSeconds`, `QrAudience`, `ScannerApiKey`
- Details: [`DigitalId.md`](DigitalId.md) · rules **`domain-digital-id.mdc`**

### 📚 Curriculum & course offerings (university)

- **Packages:** `OfferingPackagesAdminController` at `/api/Organizations/current/offering-packages` — CRUD, `PUT .../items`, `POST .../apply/{periodId}`, `POST .../revert/{periodId}`
- **Term offerings:** `CourseOfferingsAdminController` at `/api/Organizations/current/periods/{periodId}/offerings` — CRUD, enrollments, rollover, **`Credits`** on update
- **Member gradebook:** `OfferingsController` — `GET .../gradebook`, `GET .../students/{userId}/grade-breakdown` (**`GradebookService`**, `tasks` Edit + teaching team)
- **Services:** `CourseOfferingPackageService`, `CourseOfferingService`, **`GradebookService`**
- **Permission:** Org **Admin** for offering CRUD; gradebook uses **`tasks` Edit** (not `grades` Edit)
- **Apply:** creates offerings from package items; uses package program when item has none; `skipExistingNames` + `enrollLinkedPrograms`
- **Revert:** soft-deletes term offerings matching package course names + enrollments
- Full product + API reference: [`CurriculumOfferings.md`](CurriculumOfferings.md)

### 📅 Timetables (native build, preview, publish)

- **Service:** **`OfferingTimetableService`** — expand **`WeeklySessionPlanJson`**, detect **host / cohort / room** conflicts, publish recurring **`Event`** rows (with **`RoomId`**, cohort/audience JSON), bulk publish, seed **`Expected`** attendance
- **Period APIs:** **`PeriodTimetableAdminController`** at `/api/Organizations/current/periods/{periodId}`:
  - `POST preview-timetable` — proposed + published slots for a week (scope filters optional)
  - `POST timetable-publish-status` — counts + conflict totals (**full term** when scoped filters sent — `scopeFiltersApplied`)
  - `POST bulk-publish-timetable` — per-offering outcomes
  - `POST member-schedule-preview` — admin check vs member **My schedule** rules
- **Per offering:** `POST .../offerings/{offeringId}/publish-timetable` on **`CourseOfferingsAdminController`**
- **Infrastructure:** **`OfferingSessionPlanJson`**, **`EventAudienceHelper`**, **`ScheduleUserVisibilityContext`**
- **Permission:** org **Admin** only — not **`schedule`** widget
- Full reference: [`Timetables.md`](Timetables.md)

### 🕷️ Web spider & schedule import

- **Schedule only** in admin UI — news spider removed from API/workspace.
- URLs on **Organization** (`SpiderSchedulePageUrl`).
- **Import mapping:** `POST /api/web-spider/schedule/import-resolution` — **`ScrapedScheduleImportResolutionService`**
- **Apply to offering:** `POST /api/web-spider/schedule/apply-to-offering` — **`ScrapedScheduleApplyService`** → **`WeeklySessionPlanJson`**
- Optional sync: Hangfire → **`ScrapedClassEvent`**
- Infrastructure: **`ScrapedScheduleRowEnricher`** (exact activity-only labels; **`IsProgramOrGroupPageCode`**), **`ScrapedScheduleNormalizer`**, **`ScheduleTimeParser`** (`sapt. 1`, `sapt. 2`, …)
- Details: [`WebSpider.md`](WebSpider.md) · [`Timetables.md`](Timetables.md) (Import tab)
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
| [`DigitalId.md`](DigitalId.md) | Pass, scanner, attendance |
| [`CurriculumOfferings.md`](CurriculumOfferings.md) | Periods, curriculum packages, apply/revert |
| [`Timetables.md`](Timetables.md) | Preview, publish, bulk publish, member Schedule visibility |
| [`Coursework.md`](Coursework.md) | Batches, turn-in, grading, grade plan, teaching authorization |
| [`Grades.md`](Grades.md) | Coursework standing, transcript, credits, teacher gradebook |
| [`../README.md`](../README.md) | Monorepo overview |
