# Omada Mobile App - User Guide & Tutorial

Welcome to the Omada Platform mobile app. This guide explains the primary workflows available in the application, focusing on the "Plug and Play" setup for new organizations and the daily experience for users.

## 🎓 Part 1: The SuperAdmin Experience (Setup)

As a SuperAdmin, your goal is to set up a new tenant (University or Company) from scratch. The app provides a **Registration Wizard** to handle this.

### Step 1: Organization Details
- **Action**: Tap "Create Organization" on the landing screen.
- **Input**: Enter the full name (e.g., "Hogwarts University") and a short name (e.g., "HU").
- **Note**: The `Email Domain` is crucial. It determines which users belong to your organization (e.g., `@hogwarts.edu`).

### Step 2: Admin Account
- **Action**: Create the root admin account.
- **Security**: This account is created inside the same database transaction as the organization. If this fails, the organization is not created.

### Step 3: Branding & Theming 🎨
- **Feature**: **Automatic Color Extraction**.
- **Action**: Tap "Upload Logo" and select an image from your device.
- **Result**: The app sends the image to the backend (`/api/tools/extract-colors`). The server analyzes the pixels and returns a `Primary`, `Secondary`, and `Tertiary` color palette.
- **Preview**: Toggle "Light/Dark" mode to see how your app will look instantly.

### Step 4: Custom Roles
- **Action**: Define who exists in your org.
- **Defaults**: `Teacher`, `Student`.
- **Custom**: Add roles like `Dean`, `Janitor`, `Guest`.

### Step 5: Bulk User Import 📂
- **Feature**: **CSV Parsing**.
- **Action**: Upload a `.csv` or `.xlsx` file containing user details.
- **Logic**: The app parses this file locally on the device to preview the data before sending it to the server.
- **Columns**: `First Name`, `Last Name`, `Email`, `Role`, `CNP`, `Phone`.

### Step 6: Widget Selection
- **Action**: Choose which features are enabled.
- **Granularity**: You can assign widgets to specific roles.
  - *Example*: Assign "Grades" only to `Student` and `Teacher`.
  - *Example*: Assign "User Management" only to `Admin`.

---

## 📱 Part 2: The User Experience (Daily Use)

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

## 🛠 Part 3: Developer Guide (Adding Features)

### How to add a new Widget?

1. **Frontend**:
   - Create a screen in `app/(app)/(tabs)/my-new-widget.tsx`.
   - Add it to `WIDGET_INFO` in `dashboard.tsx` and `profile.tsx`.
   - Add a route in `_layout.tsx`.

2. **Backend**:
   - If the widget needs data, create a table or use the `CustomDataController` (NoSQL storage).
   - Add the widget key to the `WidgetRepository`.

### Future Roadmap 🚀

- **Push Notifications**: Notify students when grades are posted.
- **Chat Widget**: Real-time chat using the existing WebSocket infrastructure.
- **Biometric Login**: Enable FaceID/TouchID in `SecurityScreen`.

---
*Generated for Omada Platform*