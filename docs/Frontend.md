# 📱 Frontend Structure Guide

> The Omada mobile app (Expo) — routes, Clay UI, widgets, admin workspaces, and how to extend it.

**Configuration:** [`Configuration.md`](Configuration.md) · **Backend API:** [`Backend.md`](Backend.md) · **Architecture:** [`Architecture.md`](Architecture.md)

---

## 🎯 Which project to use?

| Path | Role | Use when |
|------|------|----------|
| **`mobile/`** ⭐ | Primary product — iOS, Android, Expo web | **Always** for Omada features |
| **`web/`** | Next.js 16 placeholder | Marketing / future SSR only |

> 💡 **Product browser UI** = `mobile` + `npm run web`. Platform splits live in `*.web.tsx` files **inside** `mobile/src/`.

---

## 🚀 Quick start

```bash
cd src/frontend/mobile
copy .env.example .env
# Set EXPO_PUBLIC_API_BASE_URL (LAN IP on physical device)
npm install
npm run start
```

| Script | Purpose |
|--------|---------|
| `npm run start` | 🟢 Expo dev server |
| `npm run web` | 🌐 Run in browser |
| `npm run android` / `ios` | 📱 Native builds |
| `npm run generate-api` | 🔄 Regenerate NSwag client (API on port 5069) |
| `npm run lint` | 🧹 ESLint |
| `npm run typecheck` | ✅ TypeScript check |

> ⚠️ **Restart Expo** after changing `.env` — `EXPO_PUBLIC_*` is inlined at bundle time.

---

## 📁 `mobile/src/` folder map

```text
mobile/src/
├── 🧭 app/                 Expo Router — thin routes only
├── 🌐 api/                 NSwag client, Axios, React Query keys
├── 🎨 components/          Clay design system (75 files)
├── ⚙️ config/              API URL, permissions / capabilities
├── 📦 constants/           Widget registry, animations, layout
├── 🔌 context/             Auth, org, theme, permissions
├── 🪝 hooks/               Shared hooks (24 files)
├── 🖥️ screens/             All feature UI (~304 files)
├── 🔧 services/            ToolsService (registration uploads)
├── 🎨 styles/              Global theme tokens
├── 🌍 i18n/                English + Romanian
├── 🛠️ utils/               Media URLs, biometrics, helpers
├── 🔐 lib/                 Secure token storage
├── 💾 stores/              Zustand preferences
└── 📝 types/               i18next typing
```

---

## 🧭 Routing (`app/`)

Route **groups** use parentheses — they don't appear in the URL.

```text
app/
├── _layout.tsx                 # 🏠 Providers, fonts, auth gate, persisted React Query
├── +html.tsx                   # Web HTML shell
│
├── (auth)/                     # 🔓 Logged out
│   ├── index                   # Landing page
│   ├── login-flow/             # Login + org selection
│   ├── register-flow/          # 7-step org wizard
│   ├── join                    # Join via invite code
│   └── design-system           # Clay UI showcase
│
└── (app)/                      # 🔐 Logged in
    ├── index                   # Role redirect
    ├── change-organization
    ├── (tabs)/                 # 📱 Main tab shell
    │   ├── dashboard
    │   ├── tasks
    │   ├── chat
    │   ├── schedule
    │   └── profile
    ├── (widgets)/              # 📦 Feature screens (pushed)
    ├── (settings)/             # ⚙️ settings, security
    ├── (modals)/               # 🔲 manage-favorites, search
    ├── (admin)/                # 🛡️ org-dashboard + 13 workspaces
    └── (superadmin)/           # 🌐 platform admin-dashboard
```

### 🔀 Auth routing logic

| User type | After login → |
|-----------|---------------|
| 👤 Regular user | `/dashboard` |
| 🛡️ Admin / SuperAdmin | `/org-dashboard` |
| 🌐 SuperAdmin in register-flow | Stay (org creation exception) |

**Tab bar (5 tabs):** dashboard · tasks · chat · schedule · profile

On wide web shell (≥768px): bottom tab bar hidden → `SidebarNav` + `TabShell` instead.

---

## 🌐 API layer (`api/`)

| File | Role |
|------|------|
| `generatedClient.ts` | 🤖 **NSwag output — never edit** |
| `apiClient.ts` | Axios + Bearer JWT + 401 refresh queue |
| `index.ts` | Singleton clients + `unwrap(ServiceResponse)` |
| `queryKeys.ts` | React Query keys — include **org id** for tenant data |

**Exported clients:** `authApi`, `orgApi`, `orgAdminApi`, `superAdminApi`, `adminApi`, `usersApi`, `scheduleApi`, `newsApi`, `tasksApi`, `gradesApi`, `attendanceApi`, `searchApi`, `chatApi`, `roomsApi`, `buildingsApi`, `mapsApi`, `floorplansApi`, `groupsApi`, `filesApi`, `toolsApi`, `webSpiderApi`

**Supplement files** (prefer moving into Swagger + regen):

| File | Purpose |
|------|---------|
| `floorplanGeoJsonApi.ts` | GeoJSON update, publish rooms |
| `webSpiderConfigApi.ts` | Spider admin helpers |
| `multipartMapEndpoints.ts`, `rnMultipart.ts` | Floorplan multipart uploads |

```bash
cd src/frontend/mobile
npm run generate-api   # API must be running on :5069
```

---

## 🎨 Clay design system (`components/`)

Claymorphism primitives — use these instead of raw RN chrome for product UI:

| Subfolder | Key components |
|-----------|----------------|
| `ui/` | `ClayView`, `AppText`, `AppButton`, `BottomSheet`, `BentoGrid`, pickers, empty/error states |
| `animations/` | `AnimatedItem`, `PressClay`, `FadeInView`, `ScreenTransition`, `ConfettiExplosion` |
| `navigation/` | `TabBar`, `SidebarNav`, `ClayBackButton` |
| `layout/` | `TabShell`, `PageContainer`, `WidgetPageShell`, `SplitPane`, `WizardLayout` |
| `filters/` | `FilterBottomSheet`, option pickers |
| `system/` | `JailbreakGuard`, i18n/profile sync bridges |
| `showcase/` | Design-system gallery |

Colors from **`useThemeColors()`** — org primary/secondary/tertiary merged into navigation theme.

---

## 🔐 Permissions (`config/permissions.config.ts`)

```text
Backend WidgetKeys  ←→  WIDGET_KEYS (frontend)
RolePermission      ←→  PERMISSION_MAP (view/edit/admin → capabilities)
GET /api/users/me   ←→  PermissionContext.can(capability)
```

- **Bypass:** `Admin`, `SuperAdmin`, `Super Admin` roles → all capabilities return `true`
- **Examples:** `news.view`, `rooms.book`, `schedule.edit`

---

## 🖥️ Screens (`screens/`)

Convention per feature:

```text
screens/<feature>/
  components/    ← Presentational UI
  hooks/         ← React Query, handlers, derived state
  styles/        ← StyleSheets
  utils/         ← Optional pure helpers
```

### 📦 Widget screens (`screens/widgets/`)

| Folder | Features |
|--------|----------|
| `dashboard/` | 🏠 Bento grid, favorites, highlights, search bar |
| `schedule/` | 📅 University vs corporate layouts (`.web.tsx` splits) |
| `news/` | 📰 Feed, articles, create/edit |
| `tasks/` | ✅ Task list + widget |
| `chat/` | 💬 Channels + widget |
| `grades/` | 📊 Grades + Skia charts |
| `map/` | 🗺️ Campus + indoor floorplan viewer |
| `rooms/` | 🚪 Search and booking |
| `users/` | 👥 Directory + profiles |
| `attendance/` | 📋 Records + widget |
| `assignments/` | 📝 Assignments screen + widget |
| `digital-id/` | 🪪 QR/barcode ID card |
| `profile/`, `settings/`, `security/` | 👤 Account |
| `more/` | 📱 All-apps grid |

### 🔓 Auth screens (`screens/auth/`)

| Area | Contents |
|------|----------|
| `landing/` | Welcome screen |
| `login/` | Login, org selection, change-organization |
| `register/` | 7-step wizard + `RegistrationContext` |
| `join/` | Join org via invite code |
| `design-system/` | Clay UI showcase |

**Registration wizard steps:** details → admin → branding → roles → users → widgets → success

### 🛡️ Admin screens (`screens/admin/` — 66 files)

**Hub:** `org-dashboard.tsx` + onboarding checklist

| Workspace | Route | Purpose |
|-----------|-------|---------|
| 👥 Members | `/members-workspace` | Directory, invites, invite code |
| 🔐 Roles | `/roles-workspace` | Roles + widget permissions |
| 🎨 Branding | `/branding-workspace` | Logo, colors, org type |
| 🧩 Widgets | `/widgets-workspace` | Org-wide widget catalog |
| 📅 Periods | `/periods-workspace` | Academic/operational periods |
| 📊 Grades | `/grades-workspace` | Admin grades |
| 📋 Attendance | `/attendance-workspace` | Org-wide records |
| 🚪 Rooms | `/rooms-workspace` | Create, search, delete rooms |
| 📝 Audit | `/audit-workspace` | Admin action log |
| 📐 Floorplan | `/floorplan-workspace` | Buildings, GeoJSON, publish rooms |
| 🕷️ Web spider | `/web-spider-workspace` | Timetable/news URLs, sync |
| 👥 Groups | `/groups-workspace` | Departments, teams, classes |
| 🏷️ Event types | `/event-types-workspace` | Schedule event types |

### 🌐 SuperAdmin (`screens/superadmin/`)

- **`/admin-dashboard`** — list/search/delete orgs, enter org context

---

## 🧩 Widget system & dashboard

Three related layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| Widget metadata | `constants/widgets.ts` | Names, icons, categories, presets |
| Dashboard registry | `screens/widgets/dashboard/components/WidgetRegistry.tsx` | Key → React component |
| Variant types | `constants/widgets.registry.ts` | `hero` · `card` · `bento` · `rail` |

### Registered dashboard widgets (10)

`news` · `schedule` · `tasks` · `map` · `users` · `attendance` · `assignments` · `chat` · `grades` · `rooms`

**Data flow:**

```text
useDashboardData     → org enabled widgets ∩ role permissions
useDashboardConfig   → merge BASE_WIDGETS + org theme colors
useDashboardLogic    → favorites, highlights, bento sorting
DashboardScreen      → BentoGrid + SmartHighlightFrame + search
DashboardWidget      → variant + WIDGET_REGISTRY + navigation
```

Favorites: user preferences → `/manage-favorites` modal

---

## 🔄 Cross-cutting patterns

| Pattern | Implementation |
|---------|----------------|
| 🏢 Multi-tenant | React Query keys include `orgId`; theme + permissions follow org switch |
| 📡 Data fetching | React Query in hooks — avoid raw `useEffect` loads |
| 🌐 Platform splits | `*.web.tsx` for map, schedule, grades, `ClayView` |
| 📐 Responsive web | `useBreakpoint()` / `isWideShell` (≥768px) → sidebar, split panes |
| 🖼️ Media URLs | `utils/resolveMediaUrl` with `API_BASE_URL` |
| 📦 Vertical slice | Backend DTO → Swagger → `generate-api` → hook → UI |
| 💾 Persisted cache | AsyncStorage persister (~24h GC, 5min stale) |
| ⌨️ Web Escape | Closes `BottomSheet` and modals via `useEscapeKey` |

---

## 🌍 Internationalization

| Locale | File |
|--------|------|
| 🇬🇧 English | `i18n/locales/en.json` |
| 🇷🇴 Romanian | `i18n/locales/ro.json` |

Use **`useTranslation()`** — add keys to **both** languages.

---

## ➕ Adding a frontend feature

```text
1. ✅ Ensure backend endpoint exists → npm run generate-api
2. 🧭 Add route under app/(app)/(widgets)/ or tabs
3. 🖥️ Create screens/<feature>/ with hooks/ and styles/
4. 🧩 Register dashboard widget if applicable (WIDGET_REGISTRY)
5. 🔐 Extend permissions.config.ts for new capabilities
6. 🔑 Add React Query keys in queryKeys.ts
```

---

## 📚 Related documentation

| Doc | Topic |
|-----|-------|
| [`Architecture.md`](Architecture.md) | System design |
| [`Configuration.md`](Configuration.md) | `.env` and API URL |
| [`Backend.md`](Backend.md) | API structure |
| [`WebSpider.md`](WebSpider.md) | Spider admin |
| [`../src/frontend/mobile/README.md`](../src/frontend/mobile/README.md) | Mobile quick start |
| [`../src/frontend/mobile/TUTORIAL.md`](../src/frontend/mobile/TUTORIAL.md) | User flows |
