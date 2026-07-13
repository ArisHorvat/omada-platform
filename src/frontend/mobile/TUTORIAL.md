# 🎓 Omada Mobile — User Guide & Tutorial

> Welcome to Omada! This guide walks you through setting up organizations, inviting users, and using the app day-to-day.

**Developers:** [`../../../docs/Frontend.md`](../../../docs/Frontend.md) · [`../../../docs/Configuration.md`](../../../docs/Configuration.md) · [`../../../docs/Architecture.md`](../../../docs/Architecture.md)

---

## 📋 Table of contents

| Part | Topic | Who |
|------|-------|-----|
| [Part 1](#-part-1-creating-an-organization-registration-wizard) | 3-step registration wizard + admin checklist | 🛡️ New org admin |
| [Part 2](#-part-2-joining-an-organization-new-users) | Join via invite | 👤 New users |
| [Part 3](#-part-3-the-user-experience-daily-use) | Daily app usage | 👥 All users |
| [Part 4](#-part-4-organization-admin-console) | Org admin hub | 🛡️ Admin |
| [Part 5](#-part-5-platform-admin-superadmin) | Platform management | 🌐 SuperAdmin |
| [Part 6](#-part-6-developer-guide-adding-features) | Adding features | 👨‍💻 Developers |

---

## 🌐 Part 1: Creating an Organization (Registration Wizard)

Anyone can create a new tenant (university or company) from the landing screen — **Create Organization**. The wizard has **3 steps**; roles, widgets, and invites are configured later in the **admin console checklist**.

### Step 1: Your organization 🏛️

| Action | Detail |
|--------|--------|
| **Type** | **Corporate** or **University** — two-card picker (same design as step 2 account mode) |
| **Enter** | Full name (e.g. "Hogwarts University") + short name (e.g. "HU") |

### Step 2: Admin account 👤

| Mode | Detail |
|------|--------|
| **New account** | First name, last name, email, password (with separate show/hide for password fields) |
| **Existing account** | Email + your **current Omada password** — links your existing user as this org’s admin |

> 🔒 The admin user is created in the same transaction as the organization.

### Step 3: Branding 🎨

| Feature | How it works |
|---------|--------------|
| **Preview** | Digital ID card — org name, short name, logo, theme colors |
| **Upload logo** | Tap the circle → select image (saved via **`POST /api/files/upload`**) |
| **Auto colors** | Backend extracts dominant colors → sorted swatches + generated palette presets |
| **Palettes** | **Base Colors** or **Presets** tab |
| **Finish** | Creates the org via **`POST /api/Organizations`** |

### Success screen ✅

After creation you are signed in automatically, see a **checkmark success screen**, then tap **Go to admin console** to open **`/org-dashboard`**.

> ⚙️ **Developers:** the auth guard must not redirect away from **`/register-flow/registration-success`** before you tap the button — see **`registrationSuccessFlow.ts`**.

### Finish setup in the admin console (not in the wizard)

From **`/org-dashboard`**, use the checklist and workspaces:

| Task | Where |
|------|-------|
| 🧩 Enable optional widgets | **Widget catalog** — new orgs start with **none** enabled (schedule, tasks, digital ID stay on) |
| 🔐 Roles & permissions | **Roles workspace** |
| 🎨 Branding tweaks | **Branding workspace** |
| 📅 Periods, timetables, groups, maps, spider | Respective workspaces — timetables: build patterns, preview, publish to member Schedule |
| 👥 Invite team | **Members workspace** — email invites or share org code/link |

> 📧 Configure **Brevo** (`BREVO_API_KEY`, verified `BREVO_SENDER_EMAIL`) for real invite emails; otherwise the API logs email bodies to the console.

---

## 👤 Part 2: Joining an Organization

### Email invite (from admin)

```text
1. 🔗 Open invite link (/join?code=…&token=…&email=…) from email
2. ✅ App shows org name + accept/decline (or register / sign in first)
3. 🎉 Accept → active member in that org
```

### Open org code (already have an Omada account)

```text
1. Profile → Change organization → + Join organization
2. Enter org code → submit join request
3. ⏳ Wait for admin approval (Members workspace → Approve and assign role)
4. After approval, org appears in Change organization list
```

### New user via invite link (no account)

```text
1. 🔗 Open invite link → complete registration form
2. ✅ Success screen → Go to sign in (no auto-login)
3. Sign in → accept invite if still pending
```

---

## 📱 Part 3: The User Experience (Daily Use)

### 🏠 Dynamic Dashboard

| Feature | Behavior |
|---------|----------|
| **Layout** | Changes based on widgets enabled by Admin |
| **Theme** | Entire app colored with org's palette (buttons, headers, icons) |
| **Widgets** | Bento grid with announcements, schedule, tasks, map, and more |
| **Search** | Dashboard **`SearchBar`** → **`/search`** modal — cross-widget results (people, rooms, news, tasks, schedule, groups, grades) scoped to your permissions |

### 📌 Custom Tab Bar

Too many widgets for the bottom menu? **Pin your favorites:**

```text
1. Go to Profile
2. Under "Customize Tab Bar" → tap Pin Icon next to favorites
3. Bottom tab bar updates immediately (up to 4 pinned items)
```

### 🪪 Digital ID (always on)

Every org includes **Digital ID** (with schedule and tasks) — it is not toggled in the widget catalog.

| Role | How to open | What you see |
|------|-------------|--------------|
| **Member** | Profile → **Digital ID** | Wallet-style pass with org logo and colors; **QR code** refreshes about every minute |
| **Member** | Same screen → **Show member barcode** | Optional 1D barcode in a bottom sheet (secondary to QR) |
| **Staff** (attendance or digital-id permission) | Pass → **How to use** → **Open scanner**, or Attendance → **Scan Digital ID** | Camera (or paste on web), pick session, verify, mark present or use manual roll |

> 🔆 On mobile, brightness is raised while the pass is open to help scanners read the QR.

### 📣 Announcements (replaces Chat & News)

When your org enables **Announcements**, the tab shows **channels** — org-wide, your **groups**, and **courses** you teach or take.

| Action | Who | How |
|--------|-----|-----|
| **Read posts** | Everyone with access | Open a channel; unread badge clears when you enter |
| **Comment** | Same | Expand a post → add a comment |
| **Post** | Editors (`announcements` Edit) | Compose at top of channel — title + body |
| **Live updates** | Everyone | New posts and comments appear while the app is open; after backgrounding, pull-to-refresh or reopen the tab |

> Legacy **Chat** and **News** tabs redirect here. One stream per channel — posts with comments, not free-form chat messages.

> 🏢 The pass is valid for your **current organization** only — switch org in profile if you belong to more than one.

Details: [`../../docs/DigitalId.md`](../../docs/DigitalId.md)

### 📡 Real-Time Updates

- WebSocket connection maintained while app is open
- Admin changes org name/logo → app updates **instantly**

### ☁️ Offline Mode

| Scenario | Behavior |
|----------|----------|
| 📵 No signal | View cached data (schedule, announcements) |
| ✏️ Edit while offline | Added to **Offline Queue** |
| 📶 Back online | Queue processes automatically |

---

## 🛡️ Part 4: Organization Admin Console

**Admins** land on **`/org-dashboard`** — the organization admin hub.

Use **Member app** on the admin profile (or **Admin console** on the member profile) to switch between the admin console and the normal tab-bar experience. Only organization admins see these buttons.

### ✅ Getting started checklist

The hub shows a progress checklist (each step tracked separately in the backend):

```text
Widgets → Roles → Branding → Periods → Groups
  → Locations & maps → Invite team
```

- **Widgets** — toggle optional features on (new orgs start with catalog **empty**)
- **Invite team** — marked done when more than one member exists

### 🗂️ Key workspaces

| Workspace | What you do |
|-----------|-------------|
| 👥 **People & invites** | Email invites, copy/share code & link, approve code join requests, change roles (Admin hidden) |
| 🔐 **Roles & permissions** | View/Edit/Admin per widget allowed for the org (catalog + always-on + groups for admin) |
| 🎨 **Branding** | Name, short name, logo, color palettes, org type (Corporate/University), active status — discard or save |
| 🧩 **Widget catalog** | Enable/disable **optional** features by org type (starts **empty** on new orgs); schedule, tasks, digital ID always on |
| 📅 **Periods** | Reporting periods — semesters, quarters, or cycles (edit, set current) |
| 📅 **Timetables** | Weekly session patterns, conflict preview, publish to member Schedule; **Import schedule** tab (scrape, map wizard, apply) |
| 📝 **Audit log** | Review admin actions |
| 📐 **Locations & maps** | Sites, levels, rooms, optional floorplans; assign **unassigned rooms** created during timetable import |
| 👥 **Groups** | Departments, teams, classes — always in admin nav (org structure; not a member catalog widget) |
| 🏷️ **Event types** | Schedule event types and colors |

> 🔄 Switch orgs via **Change organization** — theme and permissions follow.

---

## 🌐 Part 5: Platform Admin (SuperAdmin)

Manage the whole platform from **`/admin-dashboard`**:

| Action | Detail |
|--------|--------|
| 🔍 **Search & list** | All organizations on the platform |
| 🏢 **Enter org** | Tap org → switch JWT context → open org admin hub |
| 🗑️ **Delete org** | Permanent removal (use with care!) |
| 📝 **Platform audit** | Cross-tenant admin activity log |
| ➕ **Create tenant** | Registration wizard from platform admin header |

---

## 👨‍💻 Part 6: Developer Guide (Adding Features)

### How to add a new Widget?

```text
Backend:
  1. Entity + Service + Controller (vertical slice)
  2. Register in WidgetRegistry — set IsCoreFeature / IsAlwaysEnabled / IsInOrgCatalog / Audience
  3. Add WidgetKeys + mobile permissions.config.ts
  4. npm run generate-api

Frontend:
  1. Route in app/(app)/(widgets)/my-new-widget.tsx
  2. Screen in screens/widgets/my-new-widget/
  3. Add to WIDGET_REGISTRY (if dashboard widget)
  4. Add to BASE_WIDGETS + orgEnabledWidgets catalog keys if org-catalog toggleable
  5. Enable via Widget catalog admin workspace (if IsInOrgCatalog)
```

### 🚀 Future roadmap

| Feature | Status |
|---------|--------|
| 📧 Real email delivery (SMTP/SendGrid) | Planned |
| 🔔 Push notifications (grades posted) | Planned |
| 🔐 Biometric login (FaceID/TouchID) | Partially in SecurityScreen |

---

## 📚 More documentation

| Doc | Topic |
|-----|-------|
| [`../../../docs/Frontend.md`](../../../docs/Frontend.md) | Full mobile structure |
| [`../../../docs/Backend.md`](../../../docs/Backend.md) | API reference |
| [`../../../docs/Architecture.md`](../../../docs/Architecture.md) | System design |
| [`../../../docs/WebSpider.md`](../../../docs/WebSpider.md) | Web crawling setup |
| [`README.md`](README.md) | Developer quick start |

---

*Built with ❤️ for Omada Platform*
