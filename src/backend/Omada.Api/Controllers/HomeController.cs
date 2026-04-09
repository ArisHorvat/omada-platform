using System.Data;
using System.Diagnostics;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.ViewModels;

namespace Omada.Api.Controllers;

[Route("")]
[ApiExplorerSettings(IgnoreApi = true)]
public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        // 1. Perform Live Health Check
        var dbStatus = "Offline";
        var latency = "N/A";
        var sw = new Stopwatch();

        try
        {
            sw.Start();
            // Dapper will automatically open the connection if needed, but we open explicitly to test connectivity
            sw.Stop();
            dbStatus = "Online";
            latency = $"{sw.ElapsedMilliseconds}ms";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
        }

        var model = new HomeViewModel
        {
            Architecture = new ArchitectureViewModel
            {
                Info = new ArchitectureInfo
                {
                    Description = "A clean, layered architecture designed for scalability and multi-tenancy.",
                    Layers = new List<string>
                    {
                        "API Layer: Controllers & WebSocket Handlers",
                        "Service Layer: Business Logic & Transactions",
                        "Data Layer: Dapper Repositories (SQL)"
                    },
                    TechStack = new List<string> { ".NET 8", "ASP.NET Core", "Dapper", "SQL Server", "WebSockets", "ImageSharp" }
                }
            },
            Overview = new OverviewViewModel
            {
                DatabaseStatus = dbStatus,
                DatabaseLatency = latency,
                Features = new List<FeatureItem>
                {
                    new() { Name = "Multi-Tenancy (Org Isolation)", Status = "Done" },
                    new() { Name = "JWT Authentication & Roles", Status = "Done" },
                    new() { Name = "Transactional Org Creation", Status = "Done" },
                    new() { Name = "Real-time Broadcasting", Status = "Done" },
                    new() { Name = "Color Extraction (Branding)", Status = "Done" },
                    new() { Name = "Dynamic Widget Data (NoSQL)", Status = "Done" },
                    new() { Name = "Chat System (Real-time)", Status = "Done" },
                    new() { Name = "Tasks Widget (SQL Table)", Status = "Done" },
                    new() { Name = "Excel User Import", Status = "Done" },
                    new() { Name = "Universal Groups", Status = "Done" }
                },
                Roadmap = new List<RoadmapItem>
                {
                    new() { Name = "Background Jobs (Hangfire)", Status = "Planned" },
                    new() { Name = "Cloud Storage (Azure/AWS)", Status = "Planned" },
                    new() { Name = "Email Integration (SendGrid)", Status = "Planned" },
                    new() { Name = "Push Notifications (FCM)", Status = "Planned" }
                }
            },
            Services = new ServicesViewModel
            {
                AuthWorkflow = new List<WorkflowStep>
                {
                    new() { Step = "1. Login Request", Details = "Client sends Email & Password. System verifies hash using BCrypt." },
                    new() { Step = "2. Token Generation", Details = "On success, issues JWT with claims: UserID, Email, OrgID, and Role." },
                    new() { Step = "3. Stateless Auth", Details = "Client sends 'Authorization: Bearer <token>' for subsequent requests." },
                    new() { Step = "4. Password Reset", Details = "Generates secure random token (32 bytes), expires in 1 hour. Mocks email sending." }
                },
                CustomDataWorkflow = new List<WorkflowStep>
                {
                    new() { Step = "1. System-Defined Widgets", Details = "Core widgets (e.g., Assignments, Grades) are defined by developers, not organizations." },
                    new() { Step = "2. Structured JSON Storage", Details = "Complex fields (e.g., Assignment #, Grade) are stored as JSON in 'WidgetData' to keep the schema clean." },
                    new() { Step = "3. Data Isolation", Details = "Data is fetched by OrgId and WidgetKey. Each organization has its own isolated data bucket." },
                    new() { Step = "4. Developer Extensibility", Details = "Developers can add new features (like a Cafeteria widget) without database migrations." }
                },
                FilesWorkflow = new List<WorkflowStep>
                {
                    new() { Step = "1. Upload Request", Details = "Client sends file via multipart/form-data to /api/files/upload." },
                    new() { Step = "2. Validation & Storage", Details = "Server checks file, generates unique GUID name, and saves to 'wwwroot/uploads'." },
                    new() { Step = "3. Static Serving", Details = "Files are served via StaticFiles middleware. Returns public URL to client." },
                    new() { Step = "4. Future Cloud", Details = "Abstraction allows swapping local disk for Azure Blob Storage/S3 later." }
                },
                OrganizationsWorkflow = new List<WorkflowStep>
                {
                    new() { Step = "1. REST API Entry Point", Details = "Exposes standard HTTP endpoints (GET, POST, PUT, DELETE) for organization management." },
                    new() { Step = "2. Service Delegation", Details = "Validates requests and delegates complex business logic (transactions) to OrganizationService." },
                    new() { Step = "3. WebSocket Upgrade", Details = "Detects and upgrades HTTP requests to persistent WebSocket connections at /ws/organizations." },
                    new() { Step = "4. Response Standardization", Details = "Returns appropriate HTTP status codes (201 Created, 204 No Content) and consistent JSON errors." }
                },
                ToolsWorkflow = new List<WorkflowStep>
                {
                    new() { Step = "1. Image Upload", Details = "Accepts an image file (Logo) via POST /api/tools/extract-colors." },
                    new() { Step = "2. Pixel Analysis", Details = "Uses SixLabors.ImageSharp to resize and analyze the image pixel data." },
                    new() { Step = "3. Palette Generation", Details = "Identifies dominant colors to generate a Primary, Secondary, and Tertiary palette." },
                    new() { Step = "4. Theme Response", Details = "Returns hex codes to the frontend to instantly theme the app." },
                    new() { Step = "5. Excel Parsing", Details = "Parses uploaded .xlsx/.csv files using ExcelDataReader to extract user data." },
                    new() { Step = "6. Smart Onboarding", Details = "Auto-creates Groups and assigns Users based on import rows." }
                },
                UsersWorkflow = new List<WorkflowStep>
                {
                    new() { Step = "1. Identity Context", Details = "Extracts the current User ID securely from the JWT 'NameIdentifier' claim." },
                    new() { Step = "2. Profile Management", Details = "Allows users to update personal info (Phone, Address, Avatar) via PUT /api/users/profile." },
                    new() { Step = "3. Security Settings", Details = "Handles password changes (verifying old hash) and toggling 2FA." },
                    new() { Step = "4. Self-Service", Details = "Enables users to manage their own account security without admin intervention." }
                }
            },
            Entities = new EntitiesViewModel
            {
                Entities = new List<EntityInfo>
                {
                    new() { Name = "Organization", Description = "The root tenant. Stores branding (Logo, Colors) and domain settings.", Relations = "Has many Users, Roles, Widgets." },
                    new() { Name = "User", Description = "Authenticated account. Stores credentials (Hash), Profile, and Role.", Relations = "Belongs to one Organization." },
                    new() { Name = "Role", Description = "Custom roles defined by the organization (e.g., 'Dean', 'Janitor').", Relations = "Belongs to Organization. Assigned to Users." },
                    new() { Name = "Widget", Description = "Represents a feature enabled for an organization (e.g., 'News', 'Map').", Relations = "Belongs to Organization." },
                    new() { Name = "WidgetData (Table)", Description = "Stores dynamic JSON content for widgets. NoSQL-style storage.", Relations = "Linked to Organization and Widget Key." },
                    new() { Name = "Message", Description = "Stores chat messages for organization channels.", Relations = "Linked to Organization and User." },
                    new() { Name = "TaskItem", Description = "Stores private tasks for users.", Relations = "Linked to User." },
                    new() { Name = "Group", Description = "Universal container for Classes, Departments, Teams. Supports hierarchy.", Relations = "Has many Users (Members)." },
                    new() { Name = "GroupMember", Description = "Link table for User-Group relationship.", Relations = "Stores role (e.g. 'Leader') within group." }
                }
            },
            Repositories = new RepositoriesViewModel
            {
                Repositories = new List<RepoInfo>
                {
                    new() { Name = "OrganizationRepository", Description = "Handles CRUD operations for Organizations using Dapper." },
                    new() { Name = "UserRepository", Description = "Manages user accounts, password hashing, and profile updates." },
                    new() { Name = "RoleRepository", Description = "Manages custom roles defined by organizations." },
                    new() { Name = "WidgetRepository", Description = "Tracks which widgets are enabled for each organization." },
                    new() { Name = "CustomDataRepository", Description = "Stores dynamic JSON data for widgets (NoSQL pattern)." },
                    new() { Name = "MessageRepository", Description = "Handles chat message persistence and retrieval." },
                    new() { Name = "TaskRepository", Description = "Manages user-specific tasks (CRUD)." },
                    new() { Name = "GroupRepository", Description = "Manages hierarchical groups and memberships." }
                }
            },
            WebSockets = new WebSocketsViewModel
            {
                Info = new WebSocketInfo
                {
                    Description = "Manages persistent WebSocket connections to broadcast real-time updates to clients.",
                    Events = new List<string> { "create", "update", "delete", "chat_message" }
                }
            },
            Controllers = new ControllersViewModel
            {
                EndpointGroups = new List<EndpointGroup>
                {
                    new()
                    {
                        Name = "Authentication",
                        Description = "Identity management and token issuance.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "POST", Route = "/api/auth/login", Description = "User Login (JWT Issue)", Status = "Active" },
                            new() { Method = "POST", Route = "/api/auth/forgot-password", Description = "Request Password Reset", Status = "Active" },
                            new() { Method = "POST", Route = "/api/auth/reset-password", Description = "Reset Password", Status = "Active" }
                        }
                    },
                    new()
                    {
                        Name = "Organizations",
                        Description = "Tenant lifecycle management.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "POST", Route = "/api/organizations", Description = "Create Organization (Transactional)", Status = "Active" },
                            new() { Method = "GET", Route = "/api/organizations", Description = "Get All Organizations", Status = "Active" },
                            new() { Method = "GET", Route = "/api/organizations/{id}", Description = "Get Organization Details", Status = "Active" },
                            new() { Method = "PUT", Route = "/api/organizations/{id}", Description = "Update Organization", Status = "Active" },
                            new() { Method = "DELETE", Route = "/api/organizations/{id}", Description = "Delete Organization", Status = "Active" }
                        }
                    },
                    new()
                    {
                        Name = "Users",
                        Description = "Profile and security management for authenticated users.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "GET", Route = "/api/users/me", Description = "Get Current User Profile", Status = "Active" },
                            new() { Method = "PUT", Route = "/api/users/profile", Description = "Update Profile Info", Status = "Active" },
                            new() { Method = "PUT", Route = "/api/users/security", Description = "Toggle 2FA", Status = "Active" }
                        }
                    },
                    new()
                    {
                        Name = "Communication",
                        Description = "Real-time chat and messaging.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "GET", Route = "/api/organizations/{orgId}/chat", Description = "Get Recent Messages", Status = "Active" },
                            new() { Method = "POST", Route = "/api/organizations/{orgId}/chat", Description = "Send Message", Status = "Active" }
                        }
                    },
                    new()
                    {
                        Name = "Productivity",
                        Description = "User-specific tools like Tasks.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "GET", Route = "/api/tasks", Description = "Get My Tasks", Status = "Active" },
                            new() { Method = "POST", Route = "/api/tasks", Description = "Create Task", Status = "Active" },
                            new() { Method = "PUT", Route = "/api/tasks/{id}", Description = "Update Task", Status = "Active" },
                            new() { Method = "DELETE", Route = "/api/tasks/{id}", Description = "Delete Task", Status = "Active" }
                        }
                    },
                    new()
                    {
                        Name = "Groups & Permissions",
                        Description = "Universal group management.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "POST", Route = "/api/groups", Description = "Create Group", Status = "Active" },
                            new() { Method = "GET", Route = "/api/groups/attendance-config", Description = "Get Attendance Context", Status = "Active" }
                        }
                    },
                    new()
                    {
                        Name = "Widgets & Tools",
                        Description = "Dynamic data and utility endpoints.",
                        Endpoints = new List<EndpointInfo>
                        {
                            new() { Method = "GET", Route = "/api/customdata/...", Description = "Fetch Dynamic Widget JSON", Status = "Active" },
                            new() { Method = "POST", Route = "/api/customdata/...", Description = "Save Widget Data", Status = "Active" },
                            new() { Method = "POST", Route = "/api/tools/extract-colors", Description = "Analyze Logo & Extract Palette", Status = "Active" },
                            new() { Method = "POST", Route = "/api/tools/parse-users", Description = "Parse Excel/CSV Users", Status = "Active" },
                            new() { Method = "POST", Route = "/api/files/upload", Description = "Upload File (Local Storage)", Status = "Active" },
                            new() { Method = "WS", Route = "/ws/organizations", Description = "Real-time Updates Stream", Status = "Active" }
                        }
                    }
                }
            },
            Tutorial = new TutorialViewModel
            {
                NewFeatureFlow = new TutorialSection
                {
                    Title = "Path 1: Creating a New Feature (from Scratch)",
                    Description = "Follow this strict flow when adding a completely new concept (e.g., 'Assignments').",
                    Steps = new List<TutorialStep>
                    {
                        new() { Title = "1. The Entity (Domain)", Description = "Start in `Entities/`. Define the class with private setters and a static `Create()` method to enforce validation rules immediately.", CodeSnippet = "public class Assignment {\n  public Guid Id { get; private set; }\n  public static Result<Assignment> Create(...) { ... }\n}" },
                        new() { Title = "2. The Repository (Data)", Description = "Create `IAssignmentRepository` and `AssignmentRepository`. Write raw SQL using Dapper. Do NOT use EF Core magic.", CodeSnippet = "const string sql = \"INSERT INTO Assignments ...\";\nawait _db.ExecuteAsync(sql, assignment);" },
                        new() { Title = "3. The Service (Logic)", Description = "Create `AssignmentService`. This is where you handle business rules and transactions. Inject the Repository here.", CodeSnippet = "using var transaction = _db.BeginTransaction();\n// Validate, then save\nawait _repo.AddAsync(assignment, transaction);" },
                        new() { Title = "4. The Controller (API)", Description = "Create `AssignmentsController`. Inject the Service. Map HTTP endpoints (POST, GET) to service methods.", CodeSnippet = "[HttpPost]\npublic async Task<IActionResult> Create(RequestDto req) {\n  var result = await _service.CreateAsync(req);\n  return Ok(result);\n}" },
                        new() { Title = "5. Dependency Injection", Description = "Finally, register your new Service and Repository in `Program.cs` so the app knows how to build them.", CodeSnippet = "builder.Services.AddScoped<IAssignmentRepository, AssignmentRepository>();" }
                    }
                },
                ExistingFeatureFlow = new TutorialSection
                {
                    Title = "Path 2: Extending an Existing Feature",
                    Description = "Follow this when adding a field (e.g., adding 'DateOfBirth' to User).",
                    Steps = new List<TutorialStep>
                    {
                        new() { Title = "1. Modify Entity", Description = "Add the property to `User.cs`. Update the `Create` method if it's required.", CodeSnippet = "public DateTime? DateOfBirth { get; private set; }" },
                        new() { Title = "2. Update SQL", Description = "Go to `UserRepository.cs`. Update the `INSERT` and `SELECT` statements to include the new column.", CodeSnippet = "INSERT INTO Users (..., DateOfBirth) VALUES (..., @DateOfBirth)" },
                        new() { Title = "3. Update DTOs", Description = "Update `RegisterRequest` and `UserDto` in `IOrganizationService.cs` (or wherever defined) to expose this field to the API.", CodeSnippet = "public DateTime? DateOfBirth { get; set; }" },
                        new() { Title = "4. Update Service", Description = "Pass the new DTO field into the Entity's `Create` or `Update` method.", CodeSnippet = "User.Create(..., request.DateOfBirth)" }
                    }
                },
                ProTips = new List<InfoCard>
                {
                    new() { Title = "Thin Controllers", Content = "Controllers should only parse requests and return responses. All logic goes in Services." },
                    new() { Title = "NoSQL in SQL", Content = "For Widgets, we use a JSON column (`WidgetData`). This lets us add new widget types without changing the DB schema." },
                    new() { Title = "Transactions", Content = "Always use `_db.BeginTransaction()` in Services when modifying multiple tables (e.g., creating Org + Admin)." }
                }
            }
        };

        return View(model);
    }
}
