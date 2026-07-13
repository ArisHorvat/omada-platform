# ⚙️ Omada Backend

> ASP.NET Core **.NET 8** API — authentication, multi-tenant data, widgets, admin consoles, real-time announcements, map/floorplans, web spider, and Hangfire jobs.

---

## 🚀 Run locally (30 seconds)

```bash
cd Omada.Api
copy .env.example .env
dotnet run
```

| Resource | URL |
|----------|-----|
| 📖 Swagger | `http://localhost:5069/swagger` |
| ⏰ Hangfire | `http://localhost:5069/hangfire` |

---

## 📁 What's inside

```text
src/backend/
├── Omada.sln              Solution file
└── Omada.Api/             ⭐ Everything lives here
    ├── Controllers/       23 HTTP controllers
    ├── Services/          ~31 business services
    ├── Entities/          34 domain models
    ├── Data/              EF Core + 24 migrations
    ├── DTOs/              122 API contract files
    ├── Infrastructure/    Auth, tenancy, Hangfire
    └── Hubs/              SignalR at /ws/app
```

---

## 🧩 Key features

| Feature | Emoji | Details |
|---------|-------|---------|
| Multi-tenancy | 🏢 | JWT `OrganizationId` + EF global filters |
| Widget RBAC | 🔐 | View → Edit → Admin per widget; org catalog by type + always-on schedule/tasks/digital-id; **new orgs:** `EnabledWidgetKeysJson = "[]"` |
| Account security | 🔑 | Change password, forgot/reset email, **email OTP 2FA** at login — [`../../docs/AccountSecurity.md`](../../docs/AccountSecurity.md) |
| Org registration | 📝 | `POST /api/Organizations` — admin user + default roles; **`OnboardingCompletedStepsJson`** marks **branding** only on create |
| Org admin | 🛡️ | `/api/Organizations/current` — members (incl. `roleId` filter), roles, holding-role delete |
| Groups | 👥 | `/api/Groups` — hierarchical org chart, type catalog (`GroupTypes.cs`), membership |
| Platform admin | 🌐 | `/api/super-admin` |
| Web spider | 🕷️ | Schedule scrape, import wizard mapping/apply → **`WeeklySessionPlanJson`**; enricher + **`ScheduleTimeParser`**; optional Hangfire → **`ScrapedClassEvent`** — admin UI: Timetables Import tab only |
| Floorplan AI | 🤖 | Optional Roboflow GeoJSON on levels with images |
| Locations & maps | 🗺️ | `Building` → `Floor` → `Room`; campus lat/lng; floors without image; **`POST /api/Rooms`** returns 200 |
| Real-time announcements | 📣 | SignalR **`AppHub`** + **`AnnouncementService`** — posts/comments; CORS for negotiate — [`../../docs/Announcements.md`](../../docs/Announcements.md) |
| Digital ID | 🪪 | Rotating QR pass, staff scan, attendance record — [`../../docs/DigitalId.md`](../../docs/DigitalId.md) |
| Documents | 📁 | Corporate file library — `DocumentsController`, disk storage — [`../../docs/Documents.md`](../../docs/Documents.md) |
| Attendance | ✅ | University roll + offering breakdown; corporate work time; **`AttendanceInstanceHelper`** — [`../../docs/Attendance.md`](../../docs/Attendance.md) |
| Curriculum offerings | 📚 | Packages, term apply/revert, enrollments — [`../../docs/CurriculumOfferings.md`](../../docs/CurriculumOfferings.md) |
| Universal search | 🔍 | `GET /api/Search` — permission-scoped buckets; **`SearchService`** uses **`IServiceScopeFactory`** (one DbContext per bucket) — [`../../docs/Backend.md`](../../docs/Backend.md#-universal-search) |
| Background jobs | ⏰ | Hangfire for spider sync |

---

## 📚 Full documentation

| Doc | What's inside |
|-----|---------------|
| 📖 [`../../docs/Backend.md`](../../docs/Backend.md) | Complete folder map, controllers, services, entities |
| 🏗️ [`../../docs/Architecture.md`](../../docs/Architecture.md) | System design & data flow |
| 🔧 [`../../docs/Configuration.md`](../../docs/Configuration.md) | `.env`, appsettings, setup checklist |
| 🔐 [`../../docs/AccountSecurity.md`](../../docs/AccountSecurity.md) | Password reset & email OTP 2FA |
| 🪪 [`../../docs/DigitalId.md`](../../docs/DigitalId.md) | Digital ID pass & scanner API |
| 📁 [`../../docs/Documents.md`](../../docs/Documents.md) | Corporate file library API & storage |
| 📣 [`../../docs/Announcements.md`](../../docs/Announcements.md) | Channels, posts, comments, unread, SignalR |
| 📚 [`../../docs/CurriculumOfferings.md`](../../docs/CurriculumOfferings.md) | Curriculum packages & term offerings |
| ✅ [`../../docs/Attendance.md`](../../docs/Attendance.md) | Roll, roster, work time, instance dates |
| 🕷️ [`../../docs/WebSpider.md`](../../docs/WebSpider.md) | Web crawling deep dive |
| 📱 [`../../docs/Frontend.md`](../../docs/Frontend.md) | Mobile client structure |

---

## ➕ Adding a feature?

```text
Entity → Configuration → Service → Controller → DTO → Migration → npm run generate-api
```

See the full checklist in [`../../docs/Backend.md`](../../docs/Backend.md).
