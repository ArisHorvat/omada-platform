# 📘 Omada

## 🧩 Short Description
This application helps **universities** or **companies** manage their internal data and communication in one place.  
Each organization can register its own account, import students or employees, and choose the widgets (modules) they want to use — such as **News**, **Schedules**, **Grades**, or **Documents**.

Administrators can easily upload user data, post announcements, and manage information, while students or employees can view **personalized dashboards** based on their role.  
The goal is to provide a **centralized and customizable platform** that simplifies management, improves communication, and saves time.

---

## 🛠️ Technology Stack
*   **Backend:** ASP.NET Core Web API
*   **Frontend:** React Native
*   **Database:** [e.g., SQLite, SQL Server, PostgreSQL]
*   **Architecture:** Monorepo

---

## 🧱 Domain Details

The main entity described here is the **Organization** entity.  
This represents a university or company that registers in the system.

| Field Name | Type | Description |
|-------------|------|-------------|
| **id** | Integer | Unique identifier for the organization. |
| **name** | String | Full name of the organization (e.g., “Universitatea Babeș-Bolyai”). |
| **domain** | String | The email domain associated with the organization (e.g., `ubbcluj.ro`). Used to generate user accounts. |
| **admin_email** | String | The email of the administrator who manages the organization’s account. |
| **widgets** | Array of Strings | List of widgets (modules) selected by the organization, such as “News”, “Schedule”, “Grades”. |

### `User` Entity
Represents a student or employee within an organization. User accounts are generated based on the organization's domain.

| Field Name | Type | Description |
|---|---|---|
| **id** | Integer | Unique identifier for the user. |
| **organization_id** | Integer | Foreign key linking to the `Organization`. |
| **email** | String | The user's unique email address (e.g., `aris.horvat@ubbcluj.ro`). |
| **full_name** | String | The full name of the user. |
| **role** | String | The user's role (e.g., "Student", "Employee", "Admin"). Determines dashboard access. |
| **password_hash** | String | The hashed password for the user account. |



---

## ⚙️ CRUD Operations for the `Organization` Entity

Each CRUD operation is explained in the context of how it works in the app.

### ➕ Create
- **Action:** When a new organization registers, it fills in its details and uploads a list of users.
- **Process:**
  - The app creates a new organization record with its name, domain, and admin email.
  - Automatically generates login accounts for users based on the uploaded Excel file.
  - Stores the selected widgets in the database.
- **Example:** “UBB” registers and selects “News” and “Schedule” widgets.

---

### 📖 Read
- **Action:** Fetch all registered organizations or retrieve details of a specific one.
- **Process:**
  - The admin dashboard displays organization information, widgets, and user lists.
  - Only admins can access their own organization’s data.
- **Example:** The admin views their university’s registered widgets and uploaded user list.

---

### ✏️ Update
- **Action:** Modify organization data, such as changing the admin email or adding/removing widgets.
- **Process:**
  - Admin selects which widgets to enable or disable in the Widget Manager.
  - Changes are saved immediately to the database and reflected in all user dashboards.
- **Example:** The university adds the “Grades” widget after launch.

---

### ❌ Delete
- **Action:** Remove an organization from the system (admin-level operation).
- **Process:**
  - Deletes the organization record and all related users and widgets.
  - A confirmation dialog prevents accidental deletion.
- **Example:** A test organization is removed from the system.

---

## 💾 Persistence Details

| CRUD Operation | Local DB | Server DB | Description |
|----------------|-----------|------------|--------------|
| **Create** | ✅ Temporarily saved while registering | ✅ Persisted after submission | The form data is cached locally until the internet is available. |
| **Read** | ✅ Cached locally | ✅ Synced with latest server data | The app loads organization info even if offline. |
| **Update** | ✅ Cached changes | ✅ Synced once online | Updates are stored locally and pushed when reconnected. |
| **Delete** | ❌ | ✅ Fully handled by server | Only possible online for security reasons. |

✅ **Create**, **Read**, and **Update** are persisted both locally and on the server.  
❌ **Delete** requires a live connection for security reasons.

---

## 🌐 Offline Scenarios

Each CRUD operation includes an offline behavior:

| Operation | Offline Scenario |
|------------|------------------|
| **Create** | If the admin registers while offline, the organization data is stored locally and automatically sent to the server once the device reconnects. |
| **Read** | If offline, the app shows the most recently viewed data (cached organization info and widgets). |
| **Update** | Widget or admin changes are stored locally and synced to the server later. |
| **Delete** | Not allowed offline. The user is shown a message: “You must be online to delete an organization.” |

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites
*   .NET 8 SDK
*   Node.js (LTS version recommended)
*   A configured environment for React Native development (see official guide)

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/omada-platform.git
    cd omada-platform
    ```

2.  **Run the Backend (ASP.NET Core):**
    ```bash
    cd backend  # Or your backend folder name
    dotnet restore
    dotnet run
    ```

3.  **Run the Frontend (React Native):**
    ```bash
    cd ../mobile # Or your frontend folder name
    npm install
    npx react-native run-android  # or run-ios
    ```

## 🎨 App Mockups

The app has two main screens related to the Organization entity.

### 1️⃣ Organization List Screen
Displays a list of registered organizations (for super-admins) or the current organization details (for admins).
![alt text](image-1.png)

---

### 2️⃣ Add / Edit Organization Screen
Used during registration or when updating organization details.
![alt text](image.png)

---

**Author:** Horvat Aris  
**Year:** 2025  
**Project:** University & Company Management App  
**Course:** Computer Science – Mobile Applications

---

## 🎓 Assignment Requirements Implementation

This section details how specific technical requirements were met in the implementation of the **Organization Management** module.

### 1. Read operation is implemented in a list
**Requirement:** A list/recycler view is used linked to a view model/repository class/component.
*   **Implementation:** The `SuperAdminDashboard` screen (`src/frontend/mobile/app/(app)/(superadmin)/admin-dashboard.tsx`) uses a `FlatList` component to render the list of organizations.
*   **Linkage:** The list is not populated by a direct API call inside the component but is subscribed to the `OrganizationRepository`.

### 2. Marshaling only the affected object/operation
**Requirement:** The activity/fragment/component is marshaling only the affected object/operation. No rebuild of the list/adapter or activity/fragment/component.
*   **Implementation:**
    *   **Optimistic Updates:** In `OrganizationRepository.ts`, the `deleteOrganization` method immediately removes the specific organization from the local `organizations` array using `filter`, without re-fetching the entire list from the server.
    *   **WebSocket Updates:** When an `update` message is received via WebSocket, the repository maps over the existing array and replaces only the modified organization object, preserving the rest of the list state.

### 3. Values are retrieved only once and reused
**Requirement:** All the values are retrieved only once and reused while the application is alive. A separate repository is used.
*   **Implementation:**
    *   **Singleton Pattern:** The `OrganizationRepository` is implemented as a Singleton (`getInstance()`).
    *   **Caching:** It maintains an in-memory cache of the data (`private organizations: any[]`).
    *   **Initialization Check:** The `fetchOrganizations` method checks the `isInitialized` flag. If true, it returns immediately, ensuring the network request happens only once during the app's lifecycle (unless explicitly refreshed).

### 4. Separate thread/coroutine
**Requirement:** All server operations are handled in a separate thread/coroutine.
*   **Implementation:**
    *   **Async/Await Architecture:** All server interactions (Create, Read, Update, Delete) are implemented using `async/await` functions.
    *   **Native Thread Offloading:** The `fetch` API in React Native offloads the actual network I/O to the native platform's networking threads (outside the JS event loop).
    *   **Non-Blocking UI:** This ensures that network latency does not freeze the application UI, satisfying the requirement for separate execution contexts (coroutines).

### 5. Observer/liveData mechanism
**Requirement:** An observer/liveData mechanism is used to listen for changes.
*   **Implementation:**
    *   The `OrganizationRepository` implements a custom Observer pattern.
    *   It exposes a `subscribe(listener, errorListener)` method.
    *   The `SuperAdminDashboard` component subscribes to this repository in a `useEffect` hook. When data changes (via fetch, delete, or WebSocket), the repository calls `notifyListeners()`, automatically updating the UI.

### 6. Error Handling
**Requirement:** If we have retrieve errors the messages are handled in this view, presented to the user and logged.
*   **Implementation:**
    *   **Repository:** Catches exceptions during fetch or delete operations and calls `notifyError(message)`.
    *   **View:** The `SuperAdminDashboard` passes an error callback to the `subscribe` method: `(error) => Alert.alert('Error', error)`. This ensures the error is presented to the user via a native dialog.

### 7. WebSocket Integration
**Requirement:** A websocket is used to listen for server changes.
*   **Implementation:**
    *   The `OrganizationRepository` establishes a WebSocket connection to the backend (`/ws/organizations`).
    *   It listens for `create`, `update`, and `delete` events broadcast by the server.
    *   Upon receiving a message, the repository updates its local state and notifies the observers, keeping the UI in sync with server-side changes in real-time.

### 8. Create Operation
**Requirement:** Only the created element is added in the list. The create operation is maintained in a separate activity/fragment/component. All the main fields are available to be set. The create view/form has labels for each input field. If we have validation errors the errors are handled in this view. Only the created element is added in the db. The id is managed by the db/app. The user is not aware of the internal id. If we have persistence errors the messages are handled in this view, presented to the user and logged. Only the created element is sent to the server. The id is managed by the server. The user is not aware of the internal id.

*   **Implementation:**
    *   **Separate Component:** The creation process is handled in `RegisterScreen` (`src/frontend/mobile/app/(auth)/register.tsx`) and `WidgetSelectionScreen`, which are separate screens from the `SuperAdminDashboard` list view.
    *   **List Update:** When an organization is created, the `OrganizationRepository` receives the new object via WebSocket and pushes *only* that single element into the local `organizations` array, avoiding a full list reload.
    *   **Fields & Labels:** The registration form includes labeled inputs for all main fields: Organization Name, Short Name, Email Domain, Admin Name, Admin Email, Password, Logo, Colors, Roles, and Widgets.
    *   **Validation:** Validation logic (e.g., checking empty fields, password match, email domain) is executed directly in `RegisterScreen`. Validation errors are displayed immediately in the view using `Alert.alert`.
    *   **Database & Server:** The `createOrganization` API call sends only the new organization data. The backend `OrganizationService` inserts *only* this new entity into the database within a transaction.
    *   **ID Management:** The ID is a GUID generated internally by the server/application logic. The user does not see or input this ID during the creation process.
    *   **Error Handling:** Persistence errors (e.g., network failure, server exception) are caught in the `handleFinish` method of `WidgetSelectionScreen`. The error message is logged to the console and presented to the user via `Alert.alert`.

### 9. Update Operation
**Requirement:** Only the updated element is passed back to the list. The element is properly identified. The update operation is maintained in a separate activity/fragment/component. All the main fields are available to be updated. The update view/form has labels for each input field and the existing values are pre-populated. If we have validation errors the errors are handled in this view. The db element is reused. The id should remain the same. If we have persistence errors the messages are handled in this view, presented to the user and logged. The server element is reused. The id should remain the same.

*   **Implementation:**
    *   **Separate Component:** The update operation is performed in the `EditOrganization` screen (`src/frontend/mobile/app/(app)/organization/edit/[id].tsx`), distinct from the list view.
    *   **List Update:** Upon successful update, the backend broadcasts an `update` event via WebSocket. The `OrganizationRepository` identifies the element by its `id` and replaces *only* that specific object in the local array using `map`.
    *   **Pre-population & Fields:** The edit screen fetches existing details on load and pre-fills all input fields (Name, Domain, Colors, Roles, Widgets). All main fields are editable.
    *   **Validation:** Input validation (e.g., required fields) is performed locally in the view, displaying errors via `Alert.alert`.
    *   **Database & Server Reuse:** The backend uses an `UPDATE` SQL statement (`WHERE Id = @Id`), ensuring the existing database record is modified rather than deleted and re-created. The ID remains constant throughout the process.
    *   **Error Handling:** Any errors during the update API call are caught in the view's `handleSubmit` function and displayed to the user.

### 10. Delete Operation
**Requirement:** Only the id of the removed element is passed back to the list. The element is properly identified. A confirmation dialog is used. Only the id of the removed element is used to delete. The element is properly identified. If we have persistence errors the messages are logged and presented to the user. Only the id of the removed element is sent to the server. The element is properly identified. If we have persistence/network errors the messages are logged and presented to the user.

*   **Implementation:**
    *   **Confirmation:** The `SuperAdminDashboard` uses `Alert.alert` to prompt the user for confirmation before initiating the delete process.
    *   **List Update:** The `OrganizationRepository` uses the provided `id` to filter the local `organizations` array (`filter(o => o.id !== id)`), removing only the specific element without reloading the list.
    *   **Server Communication:** The API call sends a `DELETE` request to `/api/organizations/{id}`. Only the ID is sent in the URL; no body is transmitted.
    *   **Database:** The backend service uses the ID to locate and delete the organization and its dependencies (cascading delete logic handled in service/repo).
    *   **Error Handling:** If the network request fails or the server returns an error, the repository catches the exception, logs it to the console (`console.error`), reverts the local list change (optimistic UI rollback), and presents the error to the user via the subscribed view's `Alert.alert`.

### 11. Error/Validation messages
**Requirement:** If there are error the application should present them to the user in a friendly manner. No raw messages should be presented.

*   **Implementation:**
    *   **Sanitization:** The `OrganizationRepository` and individual screens (like `LoginScreen`) implement logic to intercept raw exceptions (e.g., "Network request failed") and convert them into user-friendly messages (e.g., "Unable to connect to the server...").
    *   **Backend Messages:** The backend API is designed to return human-readable error descriptions (e.g., "Organization not found") rather than stack traces or error codes.
    *   **Presentation:** Errors are displayed using native `Alert` dialogs with clear titles and descriptive messages, ensuring a good user experience even when things go wrong.

### 12. Client debug logs
**Requirement:** All client operations are having debug logs.
*   **Implementation:**
    *   **Console Logging:** Key operations in the frontend (Repositories, AuthContext, Screens) include `console.log` and `console.error` statements.
    *   **Traceability:** Logs track the flow of data, such as "Fetching organizations...", "WebSocket message received", and "Submitting registration data", allowing developers to trace client-side execution in the debug console.

### 13. Server logs
**Requirement:** All server operations are having debug logs.
*   **Implementation:**
    *   **ILogger Injection:** ASP.NET Core's built-in `ILogger<T>` is injected into Controllers, Services, and the WebSocketHandler.
    *   **Structured Logging:** Operations log their entry points, success states, and errors (e.g., "Received request to create organization", "Organization created successfully", "Error deleting organization").
    *   **Levels:** Different log levels (`Information`, `Warning`, `Error`) are used to categorize the importance of the logs.

### 14. Offline Persistence & Synchronization
**Requirement:** The application should persist content locally for offline access, and synchronize with a remote server when online.
*   **Implementation:**
    *   **Local Persistence:** `AsyncStorage` is used to cache the organization list and user details. On app launch, data is loaded from local storage immediately, allowing offline read access.
    *   **Offline Detection:** `NetInfo` is used to detect network status changes. Additionally, if a network request fails (e.g., connection refused), the repository automatically switches to offline mode and queues the operation.
    *   **Offline Queue:** Create, Update, and Delete operations performed while offline are added to an `offlineQueue` in `OrganizationRepository` and persisted to storage.
    *   **Optimistic UI:** Offline changes are applied immediately to the local state (e.g., a new organization appears in the list with a temporary ID), ensuring a responsive experience.
    *   **Synchronization:** When the device comes back online, the repository automatically processes the queue, sending pending requests to the server sequentially.
    *   **Read Offline:** The `MyOrganizationRepository` serves cached data when offline, ensuring users can still view their dashboard and profile.

### 15. Bonus Feature: Reactive Search
**Requirement:** Implement a real-time search/filter bar on the main list screen that updates the UI reactively as the user types.
*   **Implementation:**
    *   **Feature:** A search bar has been added to the `SuperAdminDashboard`.
    *   **Reactive Logic:** The app uses React's `useState` to track the search query and `useMemo` to filter the organization list in real-time based on the organization name or email domain.
    *   **UX:** The list updates instantly as the user types, providing immediate feedback without requiring a manual submit button or server round-trip for filtering.
