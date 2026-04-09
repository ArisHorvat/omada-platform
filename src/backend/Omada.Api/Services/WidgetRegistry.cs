using Omada.Api.Entities;
using Omada.Api.Infrastructure;

namespace Omada.Api.Services;

// Added 'IsCoreFeature' so the frontend knows not to put these in the permission toggles
public record WidgetInfo(string Key, string Name, string Description, string Icon, AccessLevel DefaultAccessLevel, bool IsCoreFeature = false);

public static class WidgetRegistry
{
    public static readonly IReadOnlyList<WidgetInfo> AvailableWidgets = new List<WidgetInfo>
    {
        // ---------------------------------------------------------
        // CORE FEATURES (Always Available - Hidden from permissions builder)
        // ---------------------------------------------------------
        new(WidgetKeys.Profile, "Profile", "User personal profile", "user-icon", AccessLevel.Edit, true),
        new(WidgetKeys.Security, "Security", "User password and 2FA", "shield-icon", AccessLevel.Edit, true),
        new(WidgetKeys.Settings, "Settings", "App preferences", "cog-icon", AccessLevel.Edit, true),
        new(WidgetKeys.More, "More", "Additional core options", "menu-icon", AccessLevel.View, true),
        new(WidgetKeys.Admin, "Admin Console", "Tenant administration", "crown-icon", AccessLevel.Admin, true),
        new(WidgetKeys.SuperAdmin, "Super Admin", "Global platform administration", "globe-icon", AccessLevel.Admin, true),

        // ---------------------------------------------------------
        // ORGANIZATION WIDGETS (Configurable in Roles)
        // ---------------------------------------------------------

        // Administration & Users
        new(WidgetKeys.Users, "Directory", "Manage organization members and roles.", "users-icon", AccessLevel.View),
        new(WidgetKeys.Groups, "Groups", "Manage classes, teams, and departments.", "structure-icon", AccessLevel.View),
        
        // Education & Academics
        new(WidgetKeys.Grades, "Grades", "Student grading and transcripts.", "star-icon", AccessLevel.View),
        new(WidgetKeys.Assignments, "Assignments", "Homework, quizzes, and coursework.", "book-icon", AccessLevel.View),
        new(WidgetKeys.Attendance, "Attendance", "Track presence for classes and events.", "clipboard-icon", AccessLevel.View),

        // Productivity
        new(WidgetKeys.Documents, "Documents", "Cloud storage and file sharing.", "folder-icon", AccessLevel.View),
        new(WidgetKeys.Tasks, "Tasks", "Manage individual and assigned action items.", "check-circle-icon", AccessLevel.Edit),
        new(WidgetKeys.Schedule, "Schedule", "View and manage calendar events.", "calendar-icon", AccessLevel.View),
        new(WidgetKeys.Events, "Events", "Discover and join organization events.", "ticket-icon", AccessLevel.View),

        // Operations & Logistics
        new(WidgetKeys.Finance, "Finance", "Tuition, payroll, and billing.", "money-icon", AccessLevel.View),
        new(WidgetKeys.Rooms, "Rooms", "Room booking and facility management.", "door-icon", AccessLevel.View),
        new(WidgetKeys.Transport, "Transport", "Bus routes and parking passes.", "bus-icon", AccessLevel.View),
        new(WidgetKeys.Map, "Campus Map", "Interactive organization map and navigation.", "map-icon", AccessLevel.View),
        new(WidgetKeys.DigitalId, "Digital ID", "Virtual access badges and barcodes.", "id-card-icon", AccessLevel.View),

        // Communication
        new(WidgetKeys.Chat, "Chat", "Real-time messaging channels.", "chat-icon", AccessLevel.Edit),
        new(WidgetKeys.News, "News", "Broadcast global announcements.", "megaphone-icon", AccessLevel.View)

    }.AsReadOnly();
}