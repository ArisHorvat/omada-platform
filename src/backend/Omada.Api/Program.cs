using FluentValidation;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.Hubs;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Configuration;
using Omada.Api.Infrastructure.Filters;
using Omada.Api.Infrastructure.Hangfire;
using Omada.Api.Infrastructure.Middleware;
using Omada.Api.Infrastructure.Options;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services;
using Omada.Api.Services.FloorplanAi;
using Omada.Api.Services.Interfaces;
using Serilog; // Add this
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Serialization;
using ZymLabs.NSwag.FluentValidation;

DotEnvBootstrap.LoadForOmadaApi();
var builder = WebApplication.CreateBuilder(args);
DotEnvBootstrap.LoadForOmadaApi(builder.Environment.ContentRootPath);

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/omada-api-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30) // Keeps 30 days of logs
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// 1. CORS Setup
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});

// 2. Database & Entity Framework Core
// Replaces the old IDbConnection / Dapper setup
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

var hangfireConnection = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(hangfireConnection));
builder.Services.AddHangfireServer();

// 3. Caching (Required for our new PermissionHandler)
builder.Services.AddMemoryCache();

// 4. Repositories & Unit of Work (The Data Engine)
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IScheduleRepository, ScheduleRepository>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IScrapedClassEventRepository, ScrapedClassEventRepository>();
builder.Services.AddScoped<INewsRepository, NewsRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<IGradeRepository, GradeRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();

// 5. Core Infrastructure
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IPublicMediaUrlResolver, PublicMediaUrlResolver>();
builder.Services.AddSingleton<IInviteLinkBuilder, InviteLinkBuilder>();
builder.Services.AddScoped<ITenantAccessor, HttpTenantAccessor>();
builder.Services.AddScoped<IUserContext, UserContext>();

// 6. Application Services (The Fat Services)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IOrganizationAdminService, OrganizationAdminService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IPermissionCacheInvalidator, PermissionCacheInvalidator>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddOptions<BrevoOptions>()
    .Bind(builder.Configuration.GetSection(BrevoOptions.SectionName))
    .PostConfigure(options => BrevoEnvFallbacks.Apply(options, builder.Configuration));
builder.Services.AddHttpClient(BrevoOptions.HttpClientName, client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IColorExtractionService, ColorExtractionService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IGradeService, GradeService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.Configure<DigitalIdOptions>(builder.Configuration.GetSection(DigitalIdOptions.SectionName));
builder.Services.AddScoped<IDigitalIdService, DigitalIdService>();
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IMapService, MapService>();
builder.Services.AddOptions<RoboflowFloorplanOptions>()
    .Bind(builder.Configuration.GetSection(RoboflowFloorplanOptions.SectionName))
    .PostConfigure(RoboflowFloorplanEnvFallbacks.Apply);
builder.Services.AddHttpClient(RoboflowFloorplanGeoJsonExtractor.HttpClientName, client =>
{
    client.Timeout = TimeSpan.FromMinutes(2);
});
builder.Services.AddScoped<IFloorplanGeoJsonExtractor, RoboflowFloorplanGeoJsonExtractor>();
builder.Services.AddScoped<IFloorplanProcessingService, FloorplanProcessingService>();
builder.Services.AddScoped<IEventTypeService, EventTypeService>();
builder.Services.AddHttpClient<IWebSpiderService, WebSpiderService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(45);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("OmadaPlatform/1.0 (WebSpider; +https://omada.local)");
});
builder.Services.AddHttpClient<IGeminiService, GeminiService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(45);
});
builder.Services.AddScoped<IScheduleSpiderSyncService, ScheduleSpiderSyncService>();
builder.Services.AddScoped<INewsSpiderSyncService, NewsSpiderSyncService>();
builder.Services.AddScoped<ISpiderSyncRunService, SpiderSyncRunService>();
builder.Services.AddScoped<ISpiderUrlResolver, SpiderUrlResolver>();
builder.Services.AddScoped<IWebSpiderAdminService, WebSpiderAdminService>();
builder.Services.AddScoped<IScrapedEntityResolutionService, ScrapedEntityResolutionService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddSingleton<ScheduleSyncJobs>();

// 7. Security & Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]!)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.NameIdentifier
    };
});

// Register the custom Permission Handler for [HasPermission] attributes
builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

builder.Services.AddControllers(options =>
    {
        options.Filters.Add<ValidationFilterAttribute>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddScoped<FluentValidationSchemaProcessor>();

builder.Services.AddOpenApiDocument((config, serviceProvider) =>
{
    config.DocumentName = "v1";
    config.Title = "Omada Platform API";
    config.Version = "v1";

    var fluentValidationSchemaProcessor = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<FluentValidationSchemaProcessor>();
    config.SchemaSettings.SchemaProcessors.Add(fluentValidationSchemaProcessor);
});


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // Ensure the database is created/migrated
        await context.Database.MigrateAsync(); 
        
        // Run the seeder
        await DbInitializer.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseOpenApi();
    app.UseSwaggerUi();
}

app.UseCors("AllowAll");

// Enable static file serving from the wwwroot folder
app.UseStaticFiles();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireDashboardNoAuthFilter() }
});

// Enable WebSockets BEFORE mapping controllers
app.UseWebSockets();

app.MapHub<AppHub>("/ws/app");

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
}
else
{
    app.MapGet("/", () => Results.Ok(new { name = "Omada.Api", status = "running" })).ExcludeFromDescription();
}

var brevoStartup = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<BrevoOptions>>().Value;
if (string.IsNullOrWhiteSpace(brevoStartup.ApiKey) || string.IsNullOrWhiteSpace(brevoStartup.SenderEmail))
    Log.Warning("Brevo email not configured — invitation emails are logged to console only.");
else
    Log.Information("Brevo email enabled (sender: {SenderEmail})", brevoStartup.SenderEmail);

app.Run();