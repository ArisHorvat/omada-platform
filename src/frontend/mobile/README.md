# Omada Platform - Mobile App

This is the mobile client for the Omada Platform, built with **Expo**, **React Native**, and **TypeScript**. It is designed to be a "Plug and Play" app for organizations, adapting its look and feel based on the user's organization.

## 🏗 Architecture

The app uses a robust architecture to handle state, offline capabilities, and navigation:

- **Expo Router**: File-based routing located in the `app/` directory.
- **Context API**: Manages global state (`AuthContext`, `OrganizationThemeContext`, `RegistrationContext`).
- **Repository Pattern**: Abstracts API calls and handles offline synchronization logic (`OrganizationRepository`, `MyOrganizationRepository`).

## ✨ Current Features

### 1. Dynamic Theming
- **Organization Context**: The app automatically applies the Primary, Secondary, and Tertiary colors of the logged-in user's organization.
- **Hooks**: `useThemeColors()` provides easy access to these dynamic colors throughout the UI.

### 2. Offline-First & Sync
- **Offline Queue**: `OrganizationRepository` detects network status. If offline, actions (Create, Update, Delete) are queued locally.
- **Auto-Sync**: When the connection is restored, the queue is processed and synced with the backend.
- **Optimistic UI**: The UI updates immediately even before the server responds.

### 3. Real-Time Updates
- **WebSockets**: The app connects to the backend via WebSockets to receive live updates. If an admin updates an organization on the web, the mobile app reflects changes instantly.

### 4. Registration Flow
- **Multi-Step Wizard**: A comprehensive flow for creating new organizations:
  1. Organization Details
  2. Admin Account Setup
  3. Branding (Logo upload + Color picking)
  4. Custom Roles definition
  5. User Import (CSV parsing)
  6. Widget Selection

### 5. Widget System
- **Modular Widgets**: The dashboard renders widgets dynamically based on what is enabled for the organization.
- **Implemented Widgets**:
  - News / Announcements
  - Schedule
  - Grades
  - Map
  - Users Directory
  - Assignments
  - Tasks

## 📂 Project Structure

| Folder | Description |
|--------|-------------|
| `app/(app)` | Protected routes (Dashboard, Tabs, Profile). |
| `app/(auth)` | Public routes (Login, Registration Flow). |
| `components` | Reusable UI components (`FormInput`, `CustomTabBar`, `DynamicListWidget`). |
| `context` | State providers (`Auth`, `Theme`, `Preferences`, `Permissions`). |
| `repositories` | Data layer handling API calls, caching, and offline sync. |
| `hooks` | Custom hooks (`useThemeColors`). |

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run the App**:
   ```bash
   npx expo start --go
   ```
3. **Config**: Ensure `config.ts` points to your running backend instance (IP address if testing on physical device).

## 🔄 Recent Additions
- **Registration Context**: Centralized state for the multi-step registration wizard.
- **Color Picker**: Integrated color picker for branding setup.
- **Document Picker**: Added support for uploading Logos and CSV files for user import.
- **Custom Tab Bar**: A dynamic tab bar that pins user-favorite widgets.