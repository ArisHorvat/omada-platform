# Omada Platform - Backend API

The **Omada Platform Backend** is a robust ASP.NET Core Web API designed to serve as the central nervous system for the Omada multi-tenant platform. It handles authentication, organization lifecycle management, dynamic widget data, and real-time synchronization with clients.

## 🏗 Architecture & Design Patterns

The solution is built using a clean, layered architecture to ensure separation of concerns:

### 1. **Controller Layer** (`/Controllers`)
- Entry points for HTTP requests.
- **`OrganizationsController`**: Manages organization CRUD.
- **`AuthController`**: Handles Login, Password Reset, and JWT Token generation.
- **`CustomDataController`**: A generic endpoint for widgets to store arbitrary JSON data (NoSQL-like behavior in SQL).
- **`ToolsController`**: Utility endpoints (e.g., extracting colors from an uploaded logo).
- **`HomeController`**: Serves the **Status Dashboard** (MVC View) for system monitoring and documentation.

### 2. **Service Layer** (`/Services`)
- Encapsulates business logic and transactions.
- **`OrganizationService`**: The core logic. It uses a **Database Transaction** to ensure that when an Organization is created, the Admin User, Default Roles, and Widgets are all created atomically. If one fails, everything rolls back.
- **`ColorExtractionService`**: Uses `SixLabors.ImageSharp` to analyze uploaded logos and automatically generate a primary/secondary/tertiary color palette.

### 3. **Repository Layer** (`/Repositories`)
- Direct data access using **Dapper** for high performance.
- **`OrganizationRepository`**, **`UserRepository`**, **`WidgetRepository`**: Standard CRUD.
- **`CustomDataRepository`**: Handles storing and retrieving JSON blobs for dynamic widgets.

### 4. **Real-Time Layer** (`/WebSocketHandlers`)
- **`WebSocketHandler`**: Manages persistent WebSocket connections.
- **Broadcasting**: When an organization is updated or created, the backend broadcasts a JSON message to all connected clients, allowing the frontend to update instantly without reloading.

## ✨ Key Features Implemented

- **Multi-Tenancy**: The system is designed around `OrganizationId`. Users and Data are isolated by organization.
- **JWT Authentication**: Stateless security with Role-based claims (`SuperAdmin`, `Admin`, `Student`, `Teacher`).
- **User Import**: Logic to accept a list of users (parsed from CSV on the client) and bulk-insert them during organization creation.
- **Dynamic Branding**: Stores and serves custom color palettes and logos for each organization.
- **File Uploads**: Local file storage implementation (in `wwwroot/uploads`) for profiles and logos.
- **Status Dashboard**: A live HTML dashboard at the root URL displaying system health, API endpoints, and architectural documentation.

## 🛠 Setup & Configuration

1. **Prerequisites**: .NET 8.0 SDK, SQL Server (or compatible).
2. **Database**: Ensure the connection string in `appsettings.json` points to your SQL instance.
3. **Run**:
   ```bash
   dotnet run
   ```
   The application will launch the **Status Dashboard** automatically at `http://localhost:5069`.
4. **API Docs**: Swagger UI is available via the link on the dashboard or at `/swagger`.

## 🔮 Future Roadmap

- **Email Integration**: Currently `EmailService` is a mock logger. Integrate SendGrid or SMTP for real invitations.
- **Cloud Storage**: Move file uploads from local disk to Azure Blob Storage or AWS S3.
- **Push Notifications**: Integrate Firebase (FCM) or Azure Notification Hubs to send push alerts to mobile apps.
- **Background Jobs**: Move heavy tasks (like bulk user import) to a background queue (e.g., Hangfire) if the lists become very large.

## 📂 Folder Structure Index

| Folder | Contents |
|--------|----------|
| `Controllers` | API Endpoints & MVC Controllers. |
| `Services` | Business logic and transaction management. |
| `Repositories` | SQL/Dapper data access. |
| `Entities` | Domain models (`User`, `Organization`, `Widget`). |
| `WebSocketHandlers` | Real-time communication logic. |
| `Abstractions` | Shared result types and DTOs. |
| `Views` | Razor views for the Status Dashboard. |
| `ViewModels` | Models for the Dashboard views. |
| `wwwroot` | Static files (CSS, JS, Uploads). |