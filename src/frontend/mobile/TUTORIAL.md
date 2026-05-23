# 🎓 Omada Mobile — User Guide & Tutorial

> Welcome to Omada! This guide walks you through setting up organizations, inviting users, and using the app day-to-day.

**Developers:** [`../../../docs/Frontend.md`](../../../docs/Frontend.md) · [`../../../docs/Configuration.md`](../../../docs/Configuration.md) · [`../../../docs/Architecture.md`](../../../docs/Architecture.md)

---

## 📋 Table of contents

| Part | Topic | Who |
|------|-------|-----|
| [Part 1](#-part-1-the-superadmin-experience-setup) | Organization setup wizard | 🌐 SuperAdmin |
| [Part 2](#-part-2-joining-an-organization-new-users) | Join via invite | 👤 New users |
| [Part 3](#-part-3-the-user-experience-daily-use) | Daily app usage | 👥 All users |
| [Part 4](#-part-4-organization-admin-console) | Org admin hub | 🛡️ Admin |
| [Part 5](#-part-5-platform-admin-superadmin) | Platform management | 🌐 SuperAdmin |
| [Part 6](#-part-6-developer-guide-adding-features) | Adding features | 👨‍💻 Developers |

---

## 🌐 Part 1: The SuperAdmin Experience (Setup)

As a **SuperAdmin**, you create new tenants (universities or companies) using the **Registration Wizard**.

### Step 1: Organization Details 🏛️

| Action | Detail |
|--------|--------|
| **Tap** | "Create Organization" on the landing screen |
| **Enter** | Full name (e.g. "Hogwarts University") + short name (e.g. "HU") |
| **Note** | Email domain derives from admin email (e.g. `@hogwarts.edu`) |

### Step 2: Admin Account 👤

| Action | Detail |
|--------|--------|
| **Create** | Root admin account (name, email, password) |
| **Security** | Created in same DB transaction as org — if this fails, org is not created |

### Step 3: Branding & Theming 🎨

| Feature | How it works |
|---------|--------------|
| **Upload Logo** | Tap "Upload Logo" → select image |
| **Auto colors** | Backend analyzes pixels → returns Primary, Secondary, Tertiary palette |
| **API** | `POST /api/tools/extract-colors` |
| **Preview** | Toggle Light/Dark to see instant preview |

### Step 4: Custom Roles 🎭

| Option | Detail |
|--------|--------|
| **Presets** | University: Student, Professor · Corporate: Employee, Project Manager |
| **Custom** | Add Dean, Janitor, Guest, etc. |
| **Always included** | `Admin` role |

### Step 5: Enable Widgets 🧩

Choose which features are enabled and assign permission levels per role:

| Example | Configuration |
|---------|---------------|
| 📊 Grades | Only `Student` + `Professor` |
| 👥 User Management | Only `Admin` |
| 📅 Schedule | All roles with View |

### Step 6: Invite Users 🔗

| Method | How |
|--------|-----|
| **Link & code** | After Finish → unique invite code + link (e.g. `/join?code=AB12CD34`) |
| **Email invites** | Add colleague emails + assign role → backend sends invitations |
| **Templates** | Wizard shows preview of member invitation + admin onboarding emails |

> 📧 In development, emails are logged to the API console (real SMTP coming soon).

---

## 👤 Part 2: Joining an Organization (New Users)

Received an invite link or code? Here's how to join:

```text
1. 🔗 Open invite link (/join?code=…) OR tap "Have an invite code?" on login
2. ✅ Enter organization code (app validates + shows org name)
3. 📝 Fill in name, email, password
4. 🎉 Tap "Create account & join" → signed in and added to org
```

> 💡 Already have an Omada account? Same join flow links your existing account.

---

## 📱 Part 3: The User Experience (Daily Use)

### 🏠 Dynamic Dashboard

| Feature | Behavior |
|---------|----------|
| **Layout** | Changes based on widgets enabled by Admin |
| **Theme** | Entire app colored with org's palette (buttons, headers, icons) |
| **Widgets** | Bento grid with news, schedule, tasks, map, and more |
| **Search** | Universal search bar → cross-widget results |

### 📌 Custom Tab Bar

Too many widgets for the bottom menu? **Pin your favorites:**

```text
1. Go to Profile
2. Under "Customize Tab Bar" → tap Pin Icon next to favorites
3. Bottom tab bar updates immediately (up to 4 pinned items)
```

### 📡 Real-Time Updates

- WebSocket connection maintained while app is open
- Admin changes org name/logo → app updates **instantly**

### ☁️ Offline Mode

| Scenario | Behavior |
|----------|----------|
| 📵 No signal | View cached data (schedule, news) |
| ✏️ Edit while offline | Added to **Offline Queue** |
| 📶 Back online | Queue processes automatically |

---

## 🛡️ Part 4: Organization Admin Console

**Admins** land on **`/org-dashboard`** — the organization admin hub.

### ✅ Getting started checklist

The hub shows a progress checklist:

```text
Invite team → Roles → Branding → Groups → Floorplans
  → Spider → Periods → Grades → Widgets → Rooms
```

### 🗂️ Key workspaces

| Workspace | What you do |
|-----------|-------------|
| 👥 **People & invites** | Search members, change roles, share invite link/code |
| 🔐 **Roles & permissions** | View/Edit/Admin per enabled widget |
| 🎨 **Branding** | Logo, colors, org type, active status |
| 🧩 **Widget catalog** | Enable/disable features org-wide |
| 📅 **Academic periods** | Semesters, terms, sprints |
| 📊 **Grades / Attendance** | Record grades, review attendance |
| 🚪 **Rooms** | Create and manage bookable rooms |
| 📝 **Audit log** | Review admin actions |
| 📐 **Floorplan** | Upload floorplans, AI room extraction, publish rooms |
| 🕷️ **Web spider** | Import timetable/news from your website |
| 👥 **Groups** | Departments, teams, classes |
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
  2. Register in WidgetRegistry (IsCoreFeature if always-on)
  3. Add WidgetKeys + mobile permissions.config.ts
  4. npm run generate-api

Frontend:
  1. Route in app/(app)/(widgets)/my-new-widget.tsx
  2. Screen in screens/widgets/my-new-widget/
  3. Add to WIDGET_REGISTRY (if dashboard widget)
  4. Enable via Widget catalog admin workspace
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
