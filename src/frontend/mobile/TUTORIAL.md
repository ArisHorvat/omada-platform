# Omada Mobile App - User Guide & Tutorial

Welcome to the Omada Platform mobile app. This guide explains the primary workflows available in the application, focusing on the "Plug and Play" setup for new organizations and the daily experience for users.

> **Developers:** [`../../../docs/Frontend.md`](../../../docs/Frontend.md) · [`../../../docs/Configuration.md`](../../../docs/Configuration.md)

## 🎓 Part 1: The SuperAdmin Experience (Setup)

As a SuperAdmin, your goal is to set up a new tenant (University or Company) from scratch. The app provides a **Registration Wizard** to handle this.

### Step 1: Organization Details
- **Action**: Tap "Create Organization" on the landing screen.
- **Input**: Enter the full name (e.g., "Hogwarts University") and a short name (e.g., "HU").
- **Note**: The email domain is derived from the admin email you enter in the next step (e.g., `@hogwarts.edu`).

### Step 2: Admin Account
- **Action**: Create the root admin account.
- **Security**: This account is created inside the same database transaction as the organization. If this fails, the organization is not created.

### Step 3: Branding & Theming 🎨
- **Feature**: **Automatic Color Extraction**.
- **Action**: Tap "Upload Logo" and select an image from your device.
- **Result**: The app sends the image to the backend (`POST /api/tools/extract-colors`). The server analyzes the pixels and returns a `Primary`, `Secondary`, and `Tertiary` color palette.
- **Preview**: Toggle "Light/Dark" mode to see how your app will look instantly.

### Step 4: Custom Roles
- **Action**: Define who exists in your org.
- **Defaults**: Presets differ by org type (e.g. university: Student, Professor; corporate: Employee, Project Manager).
- **Custom**: Add roles like `Dean`, `Janitor`, or `Guest`. `Admin` is always included.

### Step 5: Enable Widgets
- **Action**: Choose which features are enabled and assign permission levels per role.
- **Granularity**: You can assign widgets to specific roles.
  - *Example*: Assign "Grades" only to `Student` and `Professor`.
  - *Example*: Assign "User Management" only to `Admin`.

### Step 6: Invite Users 🔗
- **Feature**: **Organization invite link & code** (no CSV/Excel upload).
- **Link & code tab**:
  - After you tap **Finish**, the org gets a unique **invite code** and **invite link** (e.g. `http://localhost:8081/join?code=AB12CD34`).
  - Share the link or code so people can register and join.
  - Copy or share from the success screen after setup.
- **Email invites tab**:
  - Add colleague emails and assign a role.
  - On finish, the backend sends invitation emails (logged to the API console in dev until real SMTP is configured).
  - Each invite includes the join link and organization code.
- **Templates**: The wizard shows preview text for **member invitation** and **admin onboarding** emails so you know what recipients will see.

---

## 👥 Part 2: Joining an Organization (New Users)

If you received an invite link or code from your admin:

1. Open the invite link (`/join?code=…`) or tap **"Have an invite code? Join organization"** on the login screen.
2. Enter the **organization code** (the app validates it and shows the org name).
3. Fill in your name, email, and password.
4. Tap **Create account & join** — you are signed in and added to the organization.

If you already have an Omada account, use the same join flow; existing accounts are linked to the org (sign in afterward if needed).

---

## 📱 Part 3: The User Experience (Daily Use)

Once the organization is set up, regular users (Students/Employees) log in.

### 🏠 Dynamic Dashboard
- The dashboard layout changes based on the widgets enabled by the Admin.
- **Theme**: The entire app (buttons, headers, icons) is colored using the Organization's specific palette.

### 📌 Custom Tab Bar
- **Problem**: Too many widgets (News, Map, Grades, Schedule, etc.) to fit in the bottom menu.
- **Solution**: **User Preferences**.
- **How to use**:
  1. Go to **Profile**.
  2. Under "Customize Tab Bar", tap the **Pin Icon** next to your favorite tools.
  3. The bottom tab bar updates immediately to show your pinned items (up to 4).

### 📡 Real-Time Updates
- The app maintains a **WebSocket** connection.
- If an Admin changes the organization's name or logo on the web portal, the mobile app updates **instantly** without a refresh.

### ☁️ Offline Mode
- **Scenario**: You are in a basement classroom with no signal.
- **Behavior**:
  - You can still view cached data (Schedule, News).
  - If you perform an action (e.g., Edit Profile), it is added to an **Offline Queue**.
  - When internet returns, the app automatically processes the queue and syncs with the server.

---

## 🏛 Part 4: Organization Admin Console

After setup, **Admin** users land on **`/org-dashboard`** — the organization admin hub.

### Getting started checklist

The hub shows a **Getting started** checklist (invite team → roles → branding → groups → floorplans → spider → periods → grades → widgets → rooms). Completing each workspace advances onboarding progress.

### Key workspaces

| Workspace | What you do |
|-----------|-------------|
| **People & invites** | Search members, change roles, share invite link/code |
| **Roles & permissions** | Define who can view/edit/admin each enabled widget |
| **Branding** | Logo, colors, organization type (Corporate/University), active status |
| **Widget catalog** | Enable or disable features org-wide (roles still control access) |
| **Academic periods** | Semesters, terms, or sprints for grades and filters |
| **Grades / Attendance** | Record grades (pick students from directory search); review attendance |
| **Rooms** | Create and manage bookable rooms |
| **Audit log** | Review recent admin actions (member updates, role changes, settings) |
| **Floorplan / Web spider** | Map buildings and import timetable/news from your website |

Switch organizations from **Change organization**; theme and permissions follow the active org.

---

## 🌐 Part 5: Platform Admin (SuperAdmin)

SuperAdmins manage the whole platform from **`/admin-dashboard`**.

- **Search and list** all organizations on the platform.
- **Enter an organization** — tap an org to switch into its context and open the org admin hub (manage that tenant as SuperAdmin).
- **Delete organization** — permanent removal (use with care).
- **Platform audit log** — API endpoint for cross-tenant admin activity (org-level audit is in the org admin workspace).

To create a **new** tenant, use the registration wizard from the platform admin header or landing flow.

---

## 🛠 Part 6: Developer Guide (Adding Features)

### How to add a new Widget?

1. **Backend**:
   - Add entity/service/controller following the standard vertical slice.
   - Register in `WidgetRegistry` (set `IsCoreFeature` if always-on).
   - Add the widget key to `WidgetKeys` and mobile `permissions.config.ts`.
   - Regenerate the NSwag client: `npm run generate-api`.

2. **Frontend**:
   - Create a screen in `app/(app)/(widgets)/my-new-widget.tsx`.
   - Add it to `WIDGET_REGISTRY` in the dashboard module.
   - Enable for orgs via **Widget catalog** admin workspace (unless core).

### Future Roadmap 🚀

- **Real email delivery** (SMTP/SendGrid) for invitation and onboarding messages.
- **Push Notifications**: Notify students when grades are posted.
- **Biometric Login**: Enable FaceID/TouchID in `SecurityScreen`.

---
*Generated for Omada Platform*
