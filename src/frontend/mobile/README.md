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
| 🌐 Platform splits | `*.web.tsx` for map, schedule, grades |

---

## ✨ Notable features

| Feature | Route / Location |
|---------|------------------|
| 🏠 Widget dashboard | `(tabs)/dashboard` — bento grid, favorites |
| 🛡️ Org admin | `/org-dashboard` + 13 workspaces |
| 🌐 SuperAdmin | `/admin-dashboard` |
| 🗺️ Floorplan admin | `/floorplan-workspace` — Roboflow GeoJSON |
| 🕷️ Web spider admin | `/web-spider-workspace` |
| 🔍 Universal search | `(modals)/search` |
| 📝 Registration wizard | `(auth)/register-flow/` — 7 steps |
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
| 🕷️ [`../../../docs/WebSpider.md`](../../../docs/WebSpider.md) | Web crawling |
| 🎓 [`TUTORIAL.md`](TUTORIAL.md) | User flows (registration, invites, daily use) |
| 🏠 [`../../../README.md`](../../../README.md) | Monorepo overview |

---

## ➕ Adding a feature?

```text
Backend endpoint → npm run generate-api → route in app/ → screen in screens/ → hook + Clay UI
```

Full checklist in [`../../../docs/Frontend.md`](../../../docs/Frontend.md).
