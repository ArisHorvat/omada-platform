using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;

namespace Omada.Api.Infrastructure;

/// <summary>
/// Keeps curriculum package course activities aligned with term offering timetable activities.
/// </summary>
public static class OfferingPackageActivitySync
{
    public static List<OfferingWeeklySessionDto> DerivePackageActivitiesFromTimetable(
        IReadOnlyList<OfferingWeeklySessionDto> timetableSessions) =>
        OfferingSessionPlanJson.NormalizePackageActivities(
            OfferingSessionPlanJson.Normalize(timetableSessions.ToList()));

    public static async Task SyncMatchingPackageItemsAsync(
        ApplicationDbContext context,
        Guid orgId,
        string courseName,
        IReadOnlyList<OfferingWeeklySessionDto> timetableSessions,
        string? courseCode = null,
        CancellationToken cancellationToken = default)
    {
        var aliases = BuildCourseAliases(courseName, courseCode);
        if (aliases.Count == 0)
            return;

        var activities = DerivePackageActivitiesFromTimetable(timetableSessions);
        if (activities.Count == 0)
            return;

        var json = OfferingSessionPlanJson.Serialize(activities);

        var items = await context.CourseOfferingPackageItems
            .Where(i => i.OrganizationId == orgId && !i.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var item in items.Where(i => MatchesCourseItem(i, aliases)))
            item.WeeklySessionPlanJson = json;
    }

    private static HashSet<string> BuildCourseAliases(string courseName, string? courseCode)
    {
        var aliases = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var value in new[] { courseName, courseCode })
        {
            if (!string.IsNullOrWhiteSpace(value))
                aliases.Add(value.Trim());
        }

        return aliases;
    }

    private static bool MatchesCourseItem(CourseOfferingPackageItem item, HashSet<string> aliases)
    {
        if (aliases.Contains(item.Name.Trim()))
            return true;

        if (!string.IsNullOrWhiteSpace(item.Code) && aliases.Contains(item.Code.Trim()))
            return true;

        return false;
    }
}
