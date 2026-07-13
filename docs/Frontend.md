# 📱 Frontend Structure Guide

> The Omada mobile app (Expo) — routes, Clay UI, widgets, admin workspaces, and how to extend it.

**Configuration:** [`Configuration.md`](Configuration.md) · **Backend API:** [`Backend.md`](Backend.md) · **Architecture:** [`Architecture.md`](Architecture.md) · **Account security:** [`AccountSecurity.md`](AccountSecurity.md) · **Digital ID:** [`DigitalId.md`](DigitalId.md) · **Curriculum offerings:** [`CurriculumOfferings.md`](CurriculumOfferings.md) · **Coursework:** [`Coursework.md`](Coursework.md) · **Grades:** [`Grades.md`](Grades.md)

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
│   ├── login-flow/             # Login + org selection + 2FA email code
│   ├── forgot-password         # Request password reset email
│   ├── reset-password          # Set new password from email link (?email=&token=)
│   ├── register-flow/          # 3-step org wizard (Org → Admin → Branding) + registration-success
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
    ├── (admin)/                # 🛡️ org-dashboard + workspaces (incl. offerings)
    └── (superadmin)/           # 🌐 platform admin-dashboard
```

### 🔀 Auth routing logic

| User type | After login → |
|-----------|---------------|
| 👤 Regular user | `/dashboard` |
| 🛡️ Admin / SuperAdmin | `/org-dashboard` (admin console) |
| 🌐 SuperAdmin in register-flow | Stay (org creation exception) |
| ✅ Post-registration success | **`registrationSuccessFlow.ts`** — navigate to **`/register-flow/registration-success`** **before** **`login()`**; **`useAuthNavigationGuard`** must not redirect while flag or route is active |

**Registration wizard (`register-flow/`)**

| Step | Route | Notes |
|------|-------|-------|
| Org | `index` / `details.tsx` | **`OrganizationTypePicker`** (Corporate / University — same card UI as admin New/Existing account), name, short name |
| Admin | `admin` | New account **or** existing Omada account (email + current password) |
| Branding | `branding` | Logo upload (**`ToolsService.uploadLogo`** + picker **`mimeType`** / **`fileName`**), palettes → **`POST /api/Organizations`** |
| Success | `registration-success` | Checkmark → **Go to admin console** → `/org-dashboard` |

**Context:** `RegistrationContext`. Roles, widget catalog, and invites are **not** in the wizard — finish via **`/org-dashboard`** onboarding checklist.

**Registration wizard (legacy note):** older docs referenced 7 steps; current product uses **3 steps** + admin checklist.

**Admin ↔ member app:** Users who can access the org admin console (**Admin** / **SuperAdmin** role, or **admin** widget **Admin** on profile) see toggle buttons on profile screens — **Admin console** on member **`/profile`**, **Member app** on admin **`/admin-profile`**. **`OrgAdminExperienceContext`** tracks `console` vs `member` mode; **`useOrgAdminNavigationGuard`** only locks admins to the console in `console` mode. Resets to console on org switch. Helpers: **`utils/orgAdminAccess.ts`**, **`utils/orgAdminRoutes.ts`**.

**Tab bar (5 tabs):** dashboard · tasks · **announcements** · schedule · profile

Legacy routes **`/(tabs)/chat`** and **`/(widgets)/news`** redirect to **`/announcements`**. Tab visible when org catalog + role allow **`announcements`** (legacy **`chat`** / **`news`** keys count).

On wide web shell (≥768px): bottom tab bar hidden → `SidebarNav` + `TabShell` instead.

---

## 🌐 API layer (`api/`)

| File | Role |
|------|------|
| `generatedClient.ts` | 🤖 **NSwag output — never edit** |
| `apiClient.ts` | Axios + Bearer JWT + 401 refresh queue |
| `index.ts` | Singleton clients + `unwrap(ServiceResponse)` |
| `queryKeys.ts` | React Query keys — include **org id** for tenant data |

**Exported clients:** `authApi`, `orgApi`, `orgAdminApi`, `superAdminApi`, `adminApi`, `usersApi`, `scheduleApi`, `newsApi`, `tasksApi`, `gradesApi`, `attendanceApi`, `searchApi`, `chatApi`, `announcementsApi`, `roomsApi`, `buildingsApi`, `mapsApi`, `floorplansApi`, `groupsApi`, `filesApi`, **`documentsApi`**, `toolsApi`, `webSpiderApi`

**Supplement files** (RN/multipart or non-JSON responses — not duplicate NSwag endpoints):

| File | Purpose |
|------|---------|
| `multipartMapEndpoints.ts`, `rnMultipart.ts` | Floorplan multipart uploads (RN-safe `FormData`) |
| `uploadFile.ts`, `exportUserData.ts` | Public file upload + GDPR export (text/multipart) |
| `offeringPackagesApi.ts`, `offeringsApi.ts`, `gradebookApi.ts` | Curriculum packages, term offerings, teacher gradebook (temporary until NSwag regen includes Swagger routes) |
| `announcementsApi.ts` | Announcements client + temporary `apiClient` routes for comments/read until NSwag regen |
| `documentsApi.ts` | `DocumentsClient` + manual multipart upload and blob download (RN/web safe) |

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
| `news/` | 📰 Legacy feed (routes redirect to announcements) |
| `announcements/` | 📣 Channels, posts, comments, unread, SignalR — see [`Announcements.md`](Announcements.md) |
| `tasks/` | ✅ Task list + widget |
| `chat/` | 💬 Legacy (redirects to announcements) |
| `grades/` | 📊 Grades widget — **My grades** (coursework 1–10, transcript, credits) + **Teaching** gradebook; dashboard heroes may use formal GPA |
| `map/` | 🗺️ Campus + indoor floorplan viewer |
| `rooms/` | 🚪 Search and booking |
| `users/` | 👥 Directory + profiles |
| `attendance/` | 📋 Records + widget |
| `documents/` | 📁 Corporate file library — upload sheet, detail sheet — see [`Documents.md`](Documents.md) |
| `assignments/` | 📝 Legacy assignments widget folder (university coursework lives under **`tasks/`** + admin **`assignments-workspace/`**) |
| `digital-id/` | 🪪 Wallet pass (QR primary, barcode sheet), staff scanner, manual roll — see [`DigitalId.md`](DigitalId.md) |
| `profile/`, `settings/`, `security/` | 👤 Account — **Security:** change password (`usersApi.changePassword`), 2FA toggle, export, delete; member profile includes **Admin console** when org admin |
| `more/` | 📱 All-apps grid |

### 🔓 Auth screens (`screens/auth/`)

| Area | Contents |
|------|----------|
| `landing/` | Welcome screen |
| `login/` | Login, org selection, **`TwoFactorChallengePanel`**, change-organization |
| `forgot-password/` | Request reset email (`authApi.forgotPassword`) |
| `reset-password/` | New password from email link (`authApi.resetPassword`); per-field visibility toggles |
| `register/` | 7-step wizard + `RegistrationContext` |
| `join/` | Join org — email invite + open code (`useJoinOrganizationLogic`) |
| `design-system/` | Clay UI showcase |

**Account security flows:** see [`AccountSecurity.md`](AccountSecurity.md). Logged-in password change uses **`usersApi.changePassword`** — not `authApi.resetPassword`.

**Registration wizard steps:** details → admin → branding → roles → users → widgets → success

### 🔗 Join & org switching

| Route / entry | Use case |
|---------------|----------|
| `(auth)/join?code=…` | Email invite link (logged out → register/sign-in/accept) |
| `(app)/join-organization?mode=open` | Logged-in user joins another org by code (pending admin approval) |
| `(app)/join-organization?code=…` | Logged-in user with email invite |
| Profile → **Change organization** | `OrganizationPickerModal` + `/change-organization`; **+ Join organization** → open join |

**Hooks & context**

- **`useJoinOrganizationLogic`** — phases: register, signIn, acceptDecline, openJoin, success, pending approval
- **`useAuthNavigationGuard`** — app group redirects unauthenticated users to **`/`** (not stale join query params)
- **`AuthContext`:** **`addSession()`** when adding org while logged in; **`login()`** wipes session list (first sign-in only)
- After join/switch: invalidate **`QUERY_KEYS.myOrganizations`**

### 🛡️ Admin screens (`screens/admin/`)

**Hub:** `org-dashboard.tsx` + onboarding checklist

**Admin profile:** `admin-profile.tsx` — same account sections as member profile but admin routes (`adminAccountRoutes.ts`); **Member app** button returns to tab bar / **`/profile`** when user can access org admin console.

**Navigation config** (`screens/admin/config/`)

| File | Purpose |
|------|---------|
| `admin-navigation.config.ts` | Sidebar sections + **`filterAdminNavSections`** |
| `org-admin-workspaces.ts` | Dashboard quick-access tiles + **`filterAdminWorkspaceSections`** |
| `onboarding.config.ts` | Checklist steps (widgets → roles → branding → … → invite) + **`filterOnboardingItems`** / **`isOnboardingItemDone`** (uses **`completedOnboardingSteps`** from API; **`invite`** when **`memberCount > 1`**) |

Widget-gated nav/tiles use **`widgetKey`** or **`anyWidgetKeys`**; filtered with **`createOrgWidgetEnabledChecker(organizationType)`** from **`utils/orgEnabledWidgets.ts`** (org-type catalog + always-on schedule/tasks/digital-id). **Periods** and **Groups** have no widget gate (always in Structure). Map-gated: floorplan workspace, event types (schedule), spider (schedule or news).

**Not linked from org admin** (legacy screen folders may exist under `screens/admin/` but have no Expo routes): **grades**, **attendance**, **rooms**. Member **Grades**, **Attendance**, and **Rooms** widgets are unchanged when enabled in the org catalog.

**Wide web layout**

On tablet landscape / desktop web, **`AppShell`** shows **`AdminSidebarNav`** (240px) + main column. Every org admin workspace uses **`PageContainer fullBleed`** or **`WidgetPageShell fullBleed`** so content uses the **full main column** — not a narrow centered form (no fixed ~560px cap). Admin account screens opened from the console pass **`fullBleed={adminConsole}`** on **`WidgetPageShell`**.

| Wrapper | When |
|---------|------|
| `PageContainer fullBleed` | Most workspaces (`MembersWorkspaceScreen`, `RolesWorkspaceScreen`, …) |
| `WidgetPageShell fullBleed` | Hub, profile, groups, locations & maps (`floorplan-workspace`) |

Shared scroll padding (optional): **`screens/admin/styles/adminWorkspaceLayout.ts`** → **`adminWorkspaceScrollContent`** (`paddingHorizontal: 16`, `paddingBottom: 120`).

| Workspace | Route | Purpose |
|-----------|-------|---------|
| 👥 Members | `/members-workspace` | Directory, search, **role filter**, email invites, org code/link, approve code join requests |
| 🔐 Roles | `/roles-workspace` | Role picker, widget permissions (org-off badges), create role, **`confirmAction`** delete with holding-role preview |
| 🎨 Branding | `/branding-workspace` | Logo, name, short name, palettes, org type, active status |
| 🧩 Widgets | `/widgets-workspace` | Toggle optional org features (starts **empty** on new orgs); schedule/tasks/digital ID always on |
| 📅 Periods | `/periods-workspace` | Reporting periods (semesters, quarters, or cycles); range calendar |
| 📚 Offerings | `/offerings-workspace` | Curriculum packages, instructors, apply/revert to term (**university only**) |
| 📅 Timetables | `/timetables-workspace` | View (preview, conflicts, scope incl. room, member Schedule check) · Build & publish · **Import schedule** (scrape + import wizard) |
| 📝 Coursework | `/assignments-workspace` | Post batches, grade plan — org admin console (**university**); teachers also use **`/coursework-teaching`** |
| 📝 Audit | `/audit-workspace` | Admin action log |
| 🗺️ Locations & maps | `/floorplan-workspace` | Locations → levels → rooms; optional floorplan editor; unassigned rooms panel; sole room admin path |
| 👥 Groups | `/groups-workspace` | Org chart: faculties/teams, nested groups, members — always in admin nav; RBAC via **`groups`** permission (not a member widget catalog entry) |
| 🏷️ Event types | `/event-types-workspace` | Schedule categories + colors (schedule + room booking) |

**Roles workspace (`screens/admin/roles-workspace/`)**

- Hook: **`useRolesWorkspace`**; styles: **`styles/roles-workspace.styles.ts`**
- Role selection: **`OptionPickerSheet`** (not chip row)
- Widget rows: respect **`isEnabledForOrganization`** from **`GET /api/Admin/widgets`**
- Delete: **`confirmAction`** + **`resolveHoldingRoleOnDelete`** (`utils/defaultRole.ts`) — copy explains holding role, not arbitrary reassignment

**Members workspace — role filter**

- **`useMembersWorkspace.roleFilter`** → `orgAdminApi.getMembers(..., roleId)`
- UI: **`RoleSelectField`** + picker with **All roles** option (schedule-style filter pattern)

**Branding workspace (`screens/admin/branding-workspace/`)**

- Hook: **`useBrandingWorkspace`**; shared palette utils: **`utils/brandingPalettes.ts`** (`sortExtractedColors`, `generatePalettes`)
- Preview: **`components/branding/BrandingIdCardPreview.tsx`** (same card metaphor as register wizard)
- Logo upload → **`ToolsService.extractColors`** / **`uploadLogo`** via **`api/rnMultipart.ts`** (`appendImageUriToFormData`) — required on Expo web
- UI: **Base Colors** / **Presets** tabs; extracted swatches sorted by hue; **Discard changes** + **Save branding** (baseline `hasChanges`)
- Admin edits **name + short name** only (no email-domain field); org type **Corporate** / **University** with icons; **Active** / **Inactive**

**Periods workspace (`screens/admin/periods-workspace/`)**

- **One screen, two copy sets** — `getPeriodCopy(organization.organizationType)` switches university vs corporate titles, examples, and hints (same Clay layout).
- Hook: **`usePeriodsWorkspace`** — create, **inline edit** (`updatePeriod`), **Set as current**, delete; **`bumpOnboardingStep(..., 7)`** on first create.
- **Dates:** **`PeriodDateRangePicker`** — **`ClayDatePicker`** **`mode="range"`** (single control for start/end); **`coercePeriodDate`** / **`formatPeriodRange`** in **`utils/periodDates.ts`** (React Query may cache ISO strings).
- Components: **`PeriodListCard`**, **`PeriodUsagePreview`**; **`confirmAction`** on delete.
- **Product flow:** org-defined reporting boundaries only. **Does not** apply packages — use **`/offerings-workspace`**. Per-offering **Credits (transcript)** via **`OfferingCreditsField`** (`usePeriodOfferings.updateOfferingCredits`).

**Offerings workspace (`screens/admin/offerings-workspace/`)**

- **University only** — corporate orgs see an info message; periods still available for reporting.
- Hook: **`useOfferingsWorkspace`**; API: **`offeringPackagesApi`**, **`offeringsApi`** (regenerate NSwag when package client is in Swagger).
- **Packages:** one required **program** per package; collapsible **`PackageCourseRow`** (host + teaching team); trash icon remove; **`AdminTextInput`** for fields.
- **List:** **`AppFormField`** search + **`ProgramSelectField`** program filter; count `N of M` when filtered.
- **Apply / revert:** select period → apply (auto-save, enroll cohorts, skip duplicate names) → read-only term list → **Undo on this term** via revert.
- **Staff pickers:** **`useGroupStaffPicker`** — `pageSize` ≤ **100**; debounced **`q`** search on **`orgAdminApi.getMembers`** / **`groupsApi.getMembers`**.
- Full reference: [`CurriculumOfferings.md`](CurriculumOfferings.md)

**Timetables workspace (`screens/admin/timetables-workspace/`)**

- **Route:** `/timetables-workspace` — Structure tile **Timetables**; tabs **View** · **Build & publish** · **Import (web)** (`?tab=import` from onboarding spider step).
- Hook: **`useTimetablesWorkspace`** — period scope, teacher/program/group/course/**room** filters, preview query, publish status, bulk publish.
- **View:** **`TimetablesViewTab`** — list + Mon–Fri **`TimetableWeekGrid`**, conflict banner, **`TimetablesScopeSheet`**, **`TimetableMemberScheduleCheck`** (admin preview of member **My schedule**).
- **Build:** **`TimetablesBuildTab`** — per-offering pattern cards (from offerings workspace components), publish badges, bulk publish + **`TimetablesBulkPublishResultsSheet`**; scope banner when filters active (full-term conflict checks).
- **Import (web):** **`TimetablesImportTab`** — embeds **`WebSpiderScheduleTab`**; large-scrape **`ImportScheduleScopePanel`**; **`ImportScheduleWeekPreview`**; **`ImportScheduleSessionList`** (per-row toggles); **`ImportScheduleApplyPanel`** (map activity/teacher/room/group/course, create-new, preview/apply). See [`WebSpider.md`](WebSpider.md).
- **Rooms on patterns:** **`TimetableRoomPickerField`** (building → room); per **schedule block** when split blocks enabled — see offerings **`SessionCohortAudienceEditor`** / **`WeeklySessionRow`**.
- **Display helpers:** **`timetableDisplaySlots.ts`** — room on grid/list/detail; **`TimetableSlotDetailSheet`**.
- API (until NSwag regen): **`offeringsApi.ts`** — `previewTimetable`, `getTimetablePublishStatus`, `bulkPublishTimetable`, `publishTimetable`, `memberSchedulePreview`.
- Full reference: [`Timetables.md`](Timetables.md) · rules **`domain-timetables.mdc`**

**Coursework (`screens/admin/assignments-workspace/` + member routes)**

- **University only** — gate with **`isUniversityOrg()`** (API may return `"University"` string, not enum `0`).
- **Admin:** `/assignments-workspace` — Structure tile **Coursework**; **`useCourseworkOfferings`** → full period catalog for org admins.
- **Teachers (member):** Tasks → **Teach coursework** → `/coursework-teaching` — same **`AssignmentsWorkspaceScreen`** (`mode="member"`); offerings from **`GET /Offerings/assignable`**.
- **Batch grading:** `/coursework-batch/[batchId]` → **`AssignmentBatchGradingScreen`** — filters, search, inline expand (submission link + files + grade).
- **Student turn-in:** `/assignment/[id]` — **`PATCH /api/Tasks/{id}/submission`** (requires **`tasks` View**, not Edit).
- **Roles:** one row **Tasks** — students **View**, teachers **Edit**; legacy **`assignments`** keys aliased in **`permissions.config.ts`**.
- **Grade plan:** **`GradePlanEditor`** — **`canEditGradePlan`** false for co-instructors (host only saves).
- **Groups for audience:** **`groupsApi.getAssignable('assignment')`** — not full tree.
- Temp APIs: **`assignmentsBatchApi.ts`**, **`gradePlanApi.ts`**, **`tasksWorkApi.ts`** until NSwag regen.
- Full reference: [`Coursework.md`](Coursework.md) · rules **`domain-coursework.mdc`**

**Grades widget (`screens/widgets/grades/`)**

- Route: **`/(widgets)/grades`** → **`GradesScreen`** (biometric gate on native).
- **My grades:** `useGradesScreenLogic` — periods, enrollments, tasks → **`courseGradesModel.ts`** (1–10); **`GradesTranscriptSection`** (credits + term final); course cards + breakdown sheet.
- **Teaching:** **`GradesViewModeToggle`** when `canTeachCoursework`; **`useTeacherGradesScreenLogic`** + **`gradebookApi`**; **`GradesTeacherFiltersBar`** (picker rows; student status via sheet); student roster + breakdown.
- **Filter layout:** **`src/styles/filterPickerRow.ts`** — explicit card **`padding: 16`**; **`ClayView` `puffy` is not content inset**.
- Dashboard **`GradesHero`** / **`GradesCard`** may still use **`gradesApi.getMyGrades()`** (4.0 GPA) — separate from full-screen coursework view.
- Full reference: [`Grades.md`](Grades.md) · rules **`domain-grades.mdc`**

**Locations & maps workspace (`screens/admin/floorplan-workspace/`)**

Nav tile **Locations & maps**; route **`/floorplan-workspace`** unchanged. Sole org-admin path for **locations, levels, rooms, and optional floorplans** — no **`/rooms-workspace`** route (legacy folder may exist unlinked).

**Hierarchy:** `Building` (location) → `Floor` (level) → `Room`; optional `Floorplan` (image + GeoJSON) per level.

**Two coordinate systems:** campus **`Building.Latitude` / `Longitude`** (outdoor markers when both set) vs indoor **`Room.CoordinateX/Y`** normalized **`[0..1]`** on floorplan images.

**Browse mode (default):** **`SplitPane`** — **`LocationTreeList`** (locations → levels; “List” badge when no floorplan) | **`LocationDetailPanel`**. Hook: **`useFloorplanWorkspace`** (`workspaceIntent: 'browse' | 'create' | 'edit'`). Org id from **`activeSession.orgId`** via **`useAuth()`**.

| Action | UI | API |
|--------|-----|-----|
| New location | Form + **`LocationPinField`** / **`LocationPinPicker`** (map tap/drag) | `mapsApi` building CRUD |
| Add level | Level number only, or attach image later | `POST .../floors` — **`createFloorLevelOnly`** or multipart with **`FloorplanFile`** |
| Rooms (no floorplan) | **`LocationFloorRoomsPanel`** — add, **inline edit**, remove | `roomsApi` (`floorId` filter) |
| Floorplan editor | Locked to selected building + level; Setup / Rooms / Pins tabs | `floorplansApi` upload, GeoJSON, **`publishRooms`** |

**Conventions:** **`AdminTextField`** (web-safe focus); **`alertAction({ title, message })`** / **`confirmAction`** — not **`Alert.alert`** on web; **`CreateBuildingRequest`** / **`CreateRoomRequest`** as **value imports** (not `import type`) when using `.fromJS()`. Query keys: `['admin-map-buildings', orgId]`, `['admin-map-floors', buildingId]`, `['admin-location-floor-rooms', floorId]`.

**Permissions:** building/floor → **`map` Edit/Admin**; list room CRUD → **`rooms` Edit**. Floorplan AI requires **`map` Admin** + **`ROBOFLOW_API_KEY`**.

Details: **`.cursor/rules/domain-map-rooms-admin.mdc`**

**Event types workspace (`screens/admin/event-types-workspace/`)**

- Hook: **`useEventTypesWorkspace`**; API: **`eventTypesApi`** (`GET/POST/PUT` → schedule **Edit**, `DELETE` → schedule **Admin**)
- **Colors:** preset grid from **`constants/eventTypeColors.ts`** — same list as **`EventModal`** and **`RoomBookingModal`** per-event color pickers
- **UI:** `EventTypeColorPicker`, `EventTypeUsagePreview` (schedule agenda card + room-booking pill), `EventTypeListCard` with inline edit
- **Delete:** **`confirmAction`**; backend **`IN_USE`** if calendar **`Event`** rows or **`RoomAllowedEventTypes`** still reference the type — admin must reassign events and update room allow-lists in **locations & maps** workspace first
- After save/delete: invalidate **`QUERY_KEYS.orgAdmin.eventTypes`** and **`['event-types', orgId]`**

**Groups workspace (`screens/admin/groups-workspace/`)**

- **One screen, two copy sets** — `getGroupCopy(organization.organizationType)` in **`utils/groupLabels.ts`** (university: academic hierarchy; corporate: division/team org chart). Backend type options from **`GET /api/Groups/types`** (`GroupTypes.cs` catalogs).
- **Layout:** wide web = **`SplitPane`** (collapsible tree + search + type filter picker) | detail panel. Narrow = stacked scroll.
- **Detail panel (summary-first):** **`GroupDetailSummaryCard`** rows for sub-groups and members — full lists in sheets only (**`SearchableOptionPickerSheet`** / **`BottomSheet`**). Avoid long inline preview lists in the detail column.
- **Hook:** **`useGroupsWorkspace`** — tree expansion (`expansionInitialized`, `collectExpandableIds`), **`filterGroupTree`** (nested type/search), **`groupsApi`**, member move/add sheets.
- **Forms:** **`GroupFormSheet`** — type **`OptionPickerSheet`**, parent **`SearchableOptionPickerSheet`** (excludes self + descendants on edit).
- **Delete / confirm:** **`confirmAction`** (not `Alert.alert`) — group delete requires **groups Admin** on API.
- **Cache:** invalidate **`QUERY_KEYS.groups.*(orgId)`** and **`['groups', 'departments']`** after mutations.
- **Onboarding:** “Set up groups”; nav tile **Org chart & groups**. Always shown (org structure). Delete / confirm: **`confirmAction`** — group delete requires **groups Admin** on API.

**Expo web polish (global)**

- **`WebDocumentThemeSync`** — syncs `data-omada-theme` for dark/light scrollbars (`app/+html.tsx`).
- **`IconInput.web.tsx`** — focus highlights outer container border only (no inner input ring).
- **`confirmAction`** / **`alertAction`** — Clay dialogs via **`ConfirmDialogProvider`** in root `_layout.tsx`.

### 🌐 SuperAdmin (`screens/superadmin/`)

- **`/admin-dashboard`** — list/search/delete orgs, enter org context

---

## 🧩 Widget system & dashboard

Three related layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| Widget metadata | `constants/widgets.ts` | Names, icons, categories, org-type availability, registration presets |
| Admin catalog helpers | `screens/admin/utils/orgEnabledWidgets.ts` | Always-on keys, catalog keys by org type, nav filtering |
| Dashboard registry | `screens/widgets/dashboard/components/WidgetRegistry.tsx` | Key → React component |
| Variant types | `constants/widgets.registry.ts` | `hero` · `card` · `bento` · `rail` |

### Registered dashboard widgets (11)

`announcements` · `schedule` · `tasks` · `map` · `users` · `attendance` · `assignments` · `grades` · `rooms` · **`documents`** (corporate)

**Org catalog (admin toggles):** university → grades + shared; corporate → documents + shared; shared → **announcements**, attendance, users, map, rooms. **Always on:** schedule, tasks (includes **coursework**), digital ID. **Not member widgets:** events, transport, finance. Legacy **`chat`** / **`news`** alias to **`announcements`**.

**Data flow:**

```text
useDashboardData     → effective enabled widgets (catalog + always-on) ∩ role permissions
useDashboardConfig   → merge BASE_WIDGETS + org theme colors
useDashboardLogic    → favorites, highlights, bento sorting
DashboardScreen      → BentoGrid + SmartHighlightFrame + search
DashboardWidget      → variant + WIDGET_REGISTRY + navigation
```

Favorites: user preferences → `/manage-favorites` modal

### 🔍 Universal search

| Layer | Path / detail |
|-------|----------------|
| **Route** | `app/(app)/(modals)/search.tsx` → **`UniversalSearchScreen`** |
| **Hook** | **`screens/search/hooks/useUniversalSearch.ts`** — `searchApi.search`, debounce 300ms, min length 2 |
| **Entry** | Dashboard **`SearchBar`** — read-only on home (`onPress` → `/search`); editable on search screen |
| **Typography** | **`SearchBar`** **`TextInput`** uses **`inputTextStyle()`** from **`styles/typography.ts`** (Outfit on web, Body on native) — same as **`IconInput`** |
| **Results** | Grouped by type; tap hit **`route`** (e.g. `/user-profile?id=`, `/news-article?id=`, widget paths) |

Backend: **`GET /api/Search`** — see [`Backend.md`](Backend.md#-universal-search).

---

## 🔄 Cross-cutting patterns

| Pattern | Implementation |
|---------|----------------|
| 🏢 Multi-tenant | React Query keys include `orgId`; theme + permissions follow org switch |
| 📡 Data fetching | React Query in hooks — avoid raw `useEffect` loads |
| 🌐 Platform splits | `*.web.tsx` for map, schedule, grades, `ClayView` |
| ⌨️ TextInput fonts | **`inputTextStyle()`** in **`styles/typography.ts`** — Outfit (web) / Body (native); use on **`SearchBar`**, **`IconInput`**, admin fields |
| 📐 Responsive web | `useBreakpoint()` / `isWideShell` (≥768px) → sidebar, split panes |
| 🖼️ Media URLs | `utils/resolveMediaUrl` with `API_BASE_URL` |
| 📦 Vertical slice | Backend DTO → Swagger → `generate-api` → hook → UI |
| 💾 Persisted cache | AsyncStorage persister (~24h GC, 5min stale) |
| ⌨️ Web Escape | Closes `BottomSheet` and modals via `useEscapeKey` |
| 🛡️ Org admin mode | `OrgAdminExperienceContext` + `useOrgAdminNavigationGuard` — console vs member app |

---

## 🌍 Internationalization

| Locale | File |
|--------|------|
| 🇬🇧 English | `i18n/locales/en.json` |
| 🇷🇴 Romanian | `i18n/locales/ro.json` |

Use **`useTranslation()`** — add keys to **both** languages.

---

## 🪪 Digital ID (`screens/widgets/digital-id/`)

| Route | Screen | Notes |
|-------|--------|-------|
| `/digital-id` | `DigitalIdScreen` | Profile menu entry; QR pass + How to use; barcode in bottom sheet |
| `/digital-id-scanner` | `DigitalIdScannerScreen` | Staff — session, camera/paste, verify, manual roll |
| `/admin-digital-id` | `DigitalIdScreen` (`adminConsole`) | Org admin account menu |
| `/admin-digital-id-scanner` | `DigitalIdScannerScreen` (`adminConsole`) | From admin pass → Open scanner |

**Permissions:** `digital-id.view` (pass); `attendance.take` or `digital-id.manage` (scanner + mark present).

**Clay pattern:** reuse **`DigitalIdClaySection`** — section title outside `ClayView`; `contentOverflow="visible"`; explicit **`DIGITAL_ID_CLAY_INSET`** (`puffy` does not add padding). See [`DigitalId.md`](DigitalId.md).

**Hooks:** `useDigitalIdLogic`, `useDigitalIdScannerLogic`, `useBrightnessWhileFocused`, `useScreenshotWarning`.

**Native:** `expo-camera` for scanner — rebuild after plugin changes.

---

## 📁 Documents (`screens/widgets/documents/`)

| Route | Screen | Notes |
|-------|--------|-------|
| `/documents` | `DocumentsScreen` | Corporate catalog widget; list + folder filter + search |

**Upload:** file picker → **`DocumentFormSheet`** (display name, folder via **`OptionPickerSheet`**, optional notes) — not instant upload on pick.

**Detail:** row tap → **`DocumentDetailSheet`** — metadata scrolls; **Open** and **Download** always; **Edit details** / **Delete** only when role has Edit / Admin.

**Permissions:** `documents.view` (browse); `documents.upload` (upload + edit); `documents.manage` (delete). Org **Admin** role bypasses widget checks.

**API:** **`documentsApi.ts`** — NSwag `DocumentsClient` + manual multipart/blob for upload/download.

Full reference: [`Documents.md`](Documents.md) · rules **`domain-documents.mdc`**.

**Hooks:** `useDocumentsScreenLogic`.

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
| [`DigitalId.md`](DigitalId.md) | Pass, scanner, Clay sections |
| [`CurriculumOfferings.md`](CurriculumOfferings.md) | Periods, packages, apply/revert |
| [`Timetables.md`](Timetables.md) | Build, preview, publish, member Schedule check |
| [`Coursework.md`](Coursework.md) | Teach workspace, batches, grading, grade plan |
| [`../src/frontend/mobile/README.md`](../src/frontend/mobile/README.md) | Mobile quick start |
| [`../src/frontend/mobile/TUTORIAL.md`](../src/frontend/mobile/TUTORIAL.md) | User flows |
