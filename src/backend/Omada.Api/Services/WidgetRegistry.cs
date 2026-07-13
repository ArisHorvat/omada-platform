using Omada.Api.Entities;
using Omada.Api.Infrastructure;

namespace Omada.Api.Services;

public enum WidgetAudience : byte
{
    All = 0,
    University = 1,
    Corporate = 2
}

/// <param name="IsCoreFeature">Platform shell (profile, settings, admin) — never in org catalog or role toggles.</param>
/// <param name="IsAlwaysEnabled">Always on for every org (e.g. tab-bar features) — not toggleable in catalog.</param>
/// <param name="IsInOrgCatalog">Shown in the admin widget catalog workspace.</param>
/// <param name="Audience">Which organization types see this widget in catalog and role permissions.</param>
public record WidgetInfo(
    string Key,
    string Name,
    string Description,
    string Icon,
    AccessLevel DefaultAccessLevel,
    bool IsCoreFeature = false,
    bool IsAlwaysEnabled = false,
    bool IsInOrgCatalog = true,
    WidgetAudience Audience = WidgetAudience.All);

public static class WidgetRegistry
{
    public static readonly IReadOnlyList<WidgetInfo> AvailableWidgets = new List<WidgetInfo>
    {
        // ---------------------------------------------------------
        // CORE FEATURES (Always Available - Hidden from permissions builder)
        // ---------------------------------------------------------
        new(WidgetKeys.Profile, "Profile", "User personal profile", "user-icon", AccessLevel.Edit, IsCoreFeature: true),
        new(WidgetKeys.Security, "Security", "User password and 2FA", "shield-icon", AccessLevel.Edit, IsCoreFeature: true),
        new(WidgetKeys.Settings, "Settings", "App preferences", "cog-icon", AccessLevel.Edit, IsCoreFeature: true),
        new(WidgetKeys.More, "More", "Additional core options", "menu-icon", AccessLevel.View, IsCoreFeature: true),
        new(WidgetKeys.Admin, "Admin Console", "Tenant administration", "crown-icon", AccessLevel.Admin, IsCoreFeature: true),
        new(WidgetKeys.SuperAdmin, "Super Admin", "Global platform administration", "globe-icon", AccessLevel.Admin, IsCoreFeature: true),

        // ---------------------------------------------------------
        // ALWAYS ON (Tab bar / core member experience — not in catalog toggles)
        // ---------------------------------------------------------
        new(WidgetKeys.Schedule, "Schedule", "View and manage calendar events.", "calendar-icon", AccessLevel.View,
            IsAlwaysEnabled: true, IsInOrgCatalog: false),
        new(WidgetKeys.Tasks, "Tasks", "View: submit coursework. Edit: post and grade (teachers). Admin: delegate work tasks.", "check-circle-icon", AccessLevel.Edit,
            IsAlwaysEnabled: true, IsInOrgCatalog: false),
        new(WidgetKeys.DigitalId, "Digital ID", "Virtual access badges and barcodes.", "id-card-icon", AccessLevel.View,
            IsAlwaysEnabled: true, IsInOrgCatalog: false),

        // ---------------------------------------------------------
        // ADMIN STRUCTURE (org admin console only — not a member widget or role toggle)
        // ---------------------------------------------------------
        new(WidgetKeys.Groups, "Groups", "Manage classes, teams, and departments.", "structure-icon", AccessLevel.View,
            IsCoreFeature: true, IsInOrgCatalog: false),

        // ---------------------------------------------------------
        // ORGANIZATION WIDGETS (Configurable in admin widget catalog)
        // ---------------------------------------------------------

        // Administration & Users
        new(WidgetKeys.Users, "Directory", "Manage organization members and roles.", "users-icon", AccessLevel.View),

        // Education & Academics (university)
        new(WidgetKeys.Grades, "Grades", "Student grading and transcripts.", "star-icon", AccessLevel.View,
            Audience: WidgetAudience.University),
        new(WidgetKeys.Assignments, "Assignments (legacy)", "Merged into Tasks — kept for role permission migration.", "book-icon", AccessLevel.View,
            Audience: WidgetAudience.University, IsInOrgCatalog: false),
        new(WidgetKeys.Attendance, "Attendance", "Track presence for classes and events.", "clipboard-icon", AccessLevel.View),

        // Productivity (corporate)
        new(WidgetKeys.Documents, "Documents", "Cloud storage and file sharing.", "folder-icon", AccessLevel.View,
            Audience: WidgetAudience.Corporate),

        // Shared facilities & communication
        new(WidgetKeys.Rooms, "Rooms", "Room booking and facility management.", "door-icon", AccessLevel.View),
        new(WidgetKeys.Map, "Campus Map", "Interactive organization map and navigation.", "map-icon", AccessLevel.View),
        new(WidgetKeys.Announcements, "Announcements", "Org, group, and course channels with posts and updates.", "megaphone-icon", AccessLevel.View),

        // Legacy permission rows — not in org catalog
        new(WidgetKeys.Chat, "Chat (legacy)", "Merged into Announcements.", "chat-icon", AccessLevel.Edit, IsInOrgCatalog: false),
        new(WidgetKeys.News, "News (legacy)", "Merged into Announcements.", "megaphone-icon", AccessLevel.View, IsInOrgCatalog: false)

    }.AsReadOnly();
}
