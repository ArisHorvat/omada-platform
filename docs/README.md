# 📚 Omada Documentation Hub

Welcome to the Omada documentation! This folder is your **single source of truth** for understanding, setting up, and extending the platform.

---

## 🗺️ Where should I start?

| I want to… | Read this |
|------------|-----------|
| 🆕 **Set up the project from scratch** | [`Configuration.md`](Configuration.md) |
| 🏗️ **Understand how everything fits together** | [`Architecture.md`](Architecture.md) |
| ⚙️ **Work on the API / backend** | [`Backend.md`](Backend.md) |
| 📱 **Work on the mobile app** | [`Frontend.md`](Frontend.md) |
| 🕷️ **Configure web crawling** | [`WebSpider.md`](WebSpider.md) |
| 👤 **Learn user flows (registration, invites)** | [`../src/frontend/mobile/TUTORIAL.md`](../src/frontend/mobile/TUTORIAL.md) |
| 🌍 **Product overview** | [`../README.md`](../README.md) |

---

## 📖 All documents

### Core guides

| Doc | Emoji | Description |
|-----|-------|-------------|
| [`Architecture.md`](Architecture.md) | 🏗️ | System design, tenancy, permissions, data flow, vertical slices |
| [`Configuration.md`](Configuration.md) | 🔧 | `.env`, `appsettings`, mobile env vars, setup checklist |
| [`Backend.md`](Backend.md) | ⚙️ | `Omada.Api` folder map, controllers, services, entities, migrations |
| [`Frontend.md`](Frontend.md) | 📱 | Expo Router, Clay UI, widgets, admin workspaces, API layer |
| [`WebSpider.md`](WebSpider.md) | 🕷️ | HTML crawling, Hangfire sync, Gemini fallback, admin API |

### Project READMEs (quick entry points)

| Doc | Path | Purpose |
|-----|------|---------|
| 🏠 Monorepo overview | [`../README.md`](../README.md) | Product summary + quick start |
| ⚙️ Backend quick start | [`../src/backend/README.md`](../src/backend/README.md) | Run the API in 30 seconds |
| 📱 Mobile quick start | [`../src/frontend/mobile/README.md`](../src/frontend/mobile/README.md) | Run Expo + scripts |
| 🌐 Next.js placeholder | [`../src/frontend/web/README.md`](../src/frontend/web/README.md) | When to use vs Expo web |
| 🎓 User tutorial | [`../src/frontend/mobile/TUTORIAL.md`](../src/frontend/mobile/TUTORIAL.md) | Registration, invites, daily use |

---

## 🧩 Platform at a glance

```text
┌─────────────────────────────────────────────────────────────┐
│                    📱 Expo Mobile App                        │
│  Clay UI · Widget Dashboard · Org Admin · SuperAdmin        │
│  React Query · NSwag Client · PermissionContext             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT + SignalR
┌──────────────────────────▼──────────────────────────────────┐
│                    ⚙️ Omada.Api (.NET 8)                     │
│  Controllers → Services → EF Core → SQL Server              │
│  Tenancy · Widget RBAC · Hangfire · Roboflow · Gemini       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key concepts (cheat sheet)

| Concept | Backend | Frontend |
|---------|---------|----------|
| **Tenant** | `OrganizationId` in JWT + EF filters | Active org in `CurrentOrganizationContext` |
| **Permissions** | `[HasPermission(widget, level)]` | `PermissionContext.can(capability)` |
| **Widgets** | `WidgetKeys` + `RolePermission` | `permissions.config.ts` + dashboard registry |
| **API contract** | DTOs + Swagger | `generatedClient.ts` (NSwag) |
| **Theme** | Org branding on `Organization` | `OrganizationThemeContext` + Clay colors |

---

## 🛠️ Common workflows

### Add a new API endpoint

1. Entity + EF configuration (if needed)
2. DTO + FluentValidation validator
3. Service method + controller action
4. `[HasPermission]` if user-facing
5. EF migration if schema changed
6. **`npm run generate-api`** in mobile
7. React Query hook + UI

### Add a new mobile screen

1. Confirm NSwag client has the method
2. Route in `src/app/(app)/(widgets)/`
3. Screen folder in `src/screens/` with `hooks/`, `styles/`
4. Register dashboard widget if applicable
5. Update `permissions.config.ts` if new capabilities

### Change environment variables

1. Backend: edit `src/backend/Omada.Api/.env`
2. Mobile: edit `src/frontend/mobile/.env`
3. Restart both processes
4. See [`Configuration.md`](Configuration.md) for full variable list

---

## 📂 Repo layout reminder

```text
omada-platform/
├── docs/           ← You are here
├── src/backend/    ← Omada.Api
└── src/frontend/
    ├── mobile/     ← Primary client ⭐
    └── web/        ← Next.js placeholder
```

---

## 💡 Tips for reading these docs

- **Emojis** mark section types — 🚀 quick start, ⚠️ important, 💡 tip
- **Tables** summarize routes, controllers, and config keys
- **Mermaid diagrams** show architecture and flows (GitHub renders them)
- **Code blocks** contain copy-paste commands

If something is outdated, the **source of truth** is always the code — but these docs aim to match it closely.

**Happy exploring!** 🎉
