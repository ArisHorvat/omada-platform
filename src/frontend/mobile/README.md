# 📱 Omada Mobile (Expo)

> Primary Omada client for **iOS**, **Android**, and **web** — organization-themed Clay UI, widget dashboard, admin consoles, map, chat, and more.

---

## 🚀 Quick start

```bash
cd src/frontend/mobile
copy .env.example .env
# Edit EXPO_PUBLIC_API_BASE_URL if not using localhost
npm install
npm run start
```

Press **`w`** for web · **`a`** for Android · **`i`** for iOS

| Script | Purpose |
|--------|---------|
| `npm run start` | 🟢 Expo dev server |
| `npm run web` | 🌐 Browser bundle |
| `npm run android` / `ios` | 📱 Native run |
| `npm run generate-api` | 🔄 Regenerate NSwag client |
| `npm run lint` | 🧹 ESLint |
| `npm run typecheck` | ✅ TypeScript |

> ⚠️ Restart Expo after changing `.env`

---

## 📁 Project structure

```text
mobile/src/
├── 🧭 app/           Expo Router (thin routes)
├── 🖥️ screens/       All feature UI (~304 files)
├── 🎨 components/    Clay design system
├── 🌐 api/           NSwag generatedClient + Axios
├── 🔌 context/       Auth, org, theme, permissions
├── 🪝 hooks/         Shared hooks
├── ⚙️ config/        API URL + permissions.config.ts
└── 🌍 i18n/          English + Romanian
```

**Route pattern:** `app/(app)/(widgets)/news.tsx` → imports `screens/widgets/news/`

---

## ⚙️ Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API | `http://localhost:5069` |
| `EXPO_PUBLIC_APP_BASE_URL` | Invite links | `http://localhost:8081` |

Backend secrets (Roboflow, Gemini, SQL) live in **`src/backend/Omada.Api/.env`** — not here.

See [`../../../docs/Configuration.md`](../../../docs/Configuration.md) for full setup.

---

## 🎨 Key patterns

| Pattern | Where |
|---------|-------|
| 🎨 Clay UI | `ClayView`, `AppText`, `AppButton` + `useThemeColors()` |
| 🔐 Permissions | `PermissionContext.can(capability)` |
| 📡 Data | React Query in `screens/**/hooks/` |
| 🏢 Multi-tenant | Query keys include `orgId`; theme follows org switch |
| 🖼️ Logo multipart | `ToolsService` + `api/rnMultipart.ts` for web-safe uploads |
| 🌐 Platform splits | `*.web.tsx` for map, schedule, grades |
| 🛡️ Org admin layout | `PageContainer fullBleed` / `WidgetPageShell fullBleed` on wide web — full column beside admin sidebar |
| 🏷️ Event type colors | `constants/eventTypeColors.ts` — shared by event-types admin, schedule, room booking |
| 📅 Periods admin | `/periods-workspace` — org-aware copy, range calendar, set current; `utils/periodDates.ts` |
| 📚 Offerings admin | `/offerings-workspace` — curriculum packages, program filter, apply/revert (**university**); `useGroupStaffPicker` (`pageSize ≤ 100`) |
| 👥 Groups admin | `/groups-workspace` — collapsible tree, summary detail panel, `groupLabels.ts`; **`confirmAction`** on web |
| 🗺️ Locations & maps admin | `/floorplan-workspace` — tree + detail browse, list rooms without floorplan, optional floorplan editor; **`AdminTextField`**, **`LocationPinPicker`**, **`multipartMapEndpoints.createFloorLevelOnly`** |
| 🌐 Web UX | `WebDocumentThemeSync`, `IconInput.web`, theme scrollbars in `app/+html.tsx` |
| 🪪 Digital ID Clay | `DigitalIdClaySection` — title outside `ClayView`; `DIGITAL_ID_CLAY_INSET` (`puffy` ≠ padding) |

---

## ✨ Notable features

| Feature | Route / Location |
|---------|------------------|
| 🏠 Widget dashboard | `(tabs)/dashboard` — bento grid, favorites |
| 🧩 Widget catalog admin | `/widgets-workspace` — toggle optional features by org type; schedule/tasks/digital ID always on |
| 🔀 Admin ↔ member app | Profile screens — **Admin console** / **Member app** toggle for org admins only |
| 🛡️ Org admin | `/org-dashboard` + workspaces (members, roles, branding, groups, **locations & maps**, event types, periods, **offerings**, spider, widgets, audit) — **fullBleed** on web; nav in `screens/admin/config/` |
| 🌐 SuperAdmin | `/admin-dashboard` |
| 🗺️ Locations & maps | `/floorplan-workspace` — locations → levels → rooms; optional floorplan editor + Roboflow; campus pin picker; **sole room admin path** |
| 🕷️ Web spider admin | `/web-spider-workspace` |
| 🔍 Universal search | `(modals)/search` — dashboard **`SearchBar`** → grouped results (people, rooms, news, …); permission-scoped via `GET /api/Search` |
| 📝 Registration wizard | `(auth)/register-flow/` — **3 steps** (Org → Admin → Branding) + **registration-success**; roles/widgets/invites in admin checklist |
| 🔐 Account security | Settings → **Security** (change password, 2FA toggle); `(auth)/forgot-password`, `(auth)/reset-password`; login **2FA code** step — [`../../../docs/AccountSecurity.md`](../../../docs/AccountSecurity.md) |
| 🪪 Digital ID | Profile → `/digital-id` (QR pass); staff `/digital-id-scanner` + Attendance **Scan Digital ID** — [`../../../docs/DigitalId.md`](../../../docs/DigitalId.md) |
| 📚 Curriculum offerings | `/offerings-workspace` + `/periods-workspace` — packages, apply to term, instructors — [`../../../docs/CurriculumOfferings.md`](../../../docs/CurriculumOfferings.md) |
| 🔗 Join org | `(auth)/join` — invite code flow |

---

## 🔄 API client (NSwag)

```bash
# API must be running on port 5069
npm run generate-api
```

- Output: `src/api/generatedClient.ts` — **never edit**
- Wrappers: `src/api/index.ts` (`authApi`, `scheduleApi`, …)

---

## 📚 Documentation

| Doc | Topic |
|-----|-------|
| 📖 [`../../../docs/Frontend.md`](../../../docs/Frontend.md) | Full frontend structure guide |
| 🏗️ [`../../../docs/Architecture.md`](../../../docs/Architecture.md) | System design |
| ⚙️ [`../../../docs/Backend.md`](../../../docs/Backend.md) | API structure |
| 🔧 [`../../../docs/Configuration.md`](../../../docs/Configuration.md) | Environment setup |
| 🔐 [`../../../docs/AccountSecurity.md`](../../../docs/AccountSecurity.md) | Password, reset & 2FA flows |
| 🪪 [`../../../docs/DigitalId.md`](../../../docs/DigitalId.md) | Pass, scanner, attendance |
| 📚 [`../../../docs/CurriculumOfferings.md`](../../../docs/CurriculumOfferings.md) | Periods, packages, apply/revert |
| 🕷️ [`../../../docs/WebSpider.md`](../../../docs/WebSpider.md) | Web crawling |
| 🎓 [`TUTORIAL.md`](TUTORIAL.md) | User flows (registration, invites, daily use) |
| 🏠 [`../../../README.md`](../../../README.md) | Monorepo overview |

---

## ➕ Adding a feature?

```text
Backend endpoint → npm run generate-api → route in app/ → screen in screens/ → hook + Clay UI
```

Full checklist in [`../../../docs/Frontend.md`](../../../docs/Frontend.md).
