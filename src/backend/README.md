# ⚙️ Omada Backend

> ASP.NET Core **.NET 8** API — authentication, multi-tenant data, widgets, admin consoles, real-time chat, map/floorplans, web spider, and Hangfire jobs.

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
| Widget RBAC | 🔐 | View → Edit → Admin per widget |
| Org admin | 🛡️ | `/api/Organizations/current` |
| Platform admin | 🌐 | `/api/super-admin` |
| Web spider | 🕷️ | Crawl timetables & news |
| Floorplan AI | 🤖 | Roboflow → GeoJSON room geometry |
| Real-time chat | 💬 | SignalR + `ChatService` |
| Background jobs | ⏰ | Hangfire for spider sync |

---

## 📚 Full documentation

| Doc | What's inside |
|-----|---------------|
| 📖 [`../../docs/Backend.md`](../../docs/Backend.md) | Complete folder map, controllers, services, entities |
| 🏗️ [`../../docs/Architecture.md`](../../docs/Architecture.md) | System design & data flow |
| 🔧 [`../../docs/Configuration.md`](../../docs/Configuration.md) | `.env`, appsettings, setup checklist |
| 🕷️ [`../../docs/WebSpider.md`](../../docs/WebSpider.md) | Web crawling deep dive |
| 📱 [`../../docs/Frontend.md`](../../docs/Frontend.md) | Mobile client structure |

---

## ➕ Adding a feature?

```text
Entity → Configuration → Service → Controller → DTO → Migration → npm run generate-api
```

See the full checklist in [`../../docs/Backend.md`](../../docs/Backend.md).
