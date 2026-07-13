using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Infrastructure;

/// <summary>
/// When a scraped host placeholder is linked to a member, update timetable patterns and published events.
/// </summary>
public static class ScrapedHostAliasPropagation
{
    public static async Task<int> PropagateAsync(
        ApplicationDbContext context,
        Guid organizationId,
        Guid hostUserId,
        IEnumerable<string> matchNames,
        CancellationToken cancellationToken = default)
    {
        var matchers = BuildMatchers(matchNames);
        if (matchers.Count == 0 || hostUserId == Guid.Empty)
            return 0;

        var changed = 0;

        var offerings = await context.CourseOfferings
            .Where(o => o.OrganizationId == organizationId && !o.IsDeleted && o.WeeklySessionPlanJson != null)
            .ToListAsync(cancellationToken);

        foreach (var offering in offerings)
        {
            var sessions = OfferingSessionPlanJson.Parse(offering.WeeklySessionPlanJson).ToList();
            if (sessions.Count == 0)
                continue;

            var planChanged = ApplyToSessions(sessions, hostUserId, matchers);
            if (!planChanged)
                continue;

            offering.WeeklySessionPlanJson = OfferingSessionPlanJson.Serialize(sessions);
            offering.UpdatedAt = DateTime.UtcNow;
            context.CourseOfferings.Update(offering);

            var instructorInputs = OfferingSessionPlanSync.DeriveInstructorInputs(sessions, offering.HostId);
            await OfferingInstructorSync.SyncAsync(
                context,
                organizationId,
                offering.Id,
                instructorInputs,
                instructorInputs.FirstOrDefault(i => OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary)?.UserId
                    ?? offering.HostId,
                cancellationToken);

            changed++;
        }

        var events = await context.Events
            .Where(e =>
                e.OrganizationId == organizationId
                && !e.IsDeleted
                && !e.HostId.HasValue
                && e.HostDisplayName != null)
            .ToListAsync(cancellationToken);

        foreach (var evt in events)
        {
            if (!NameMatches(evt.HostDisplayName, matchers))
                continue;

            evt.HostId = hostUserId;
            evt.HostDisplayName = null;
            evt.UpdatedAt = DateTime.UtcNow;
            context.Events.Update(evt);
            changed++;
        }

        if (changed > 0)
            await context.SaveChangesAsync(cancellationToken);

        return changed;
    }

    public static List<string> CollectMatchNames(string scrapedLabel, string? pendingDisplayName)
    {
        var names = new List<string>();
        if (!string.IsNullOrWhiteSpace(scrapedLabel))
            names.Add(scrapedLabel.Trim());
        if (!string.IsNullOrWhiteSpace(pendingDisplayName))
            names.Add(pendingDisplayName.Trim());
        return names;
    }

    private static bool ApplyToSessions(
        List<OfferingWeeklySessionDto> sessions,
        Guid hostUserId,
        IReadOnlyList<string> matchers)
    {
        var changed = false;

        foreach (var session in sessions)
        {
            if (!session.HostId.HasValue && NameMatches(session.HostName, matchers))
            {
                session.HostId = hostUserId;
                session.HostName = null;
                changed = true;
            }

            if (session.CohortAssignments == null)
                continue;

            foreach (var assignment in session.CohortAssignments)
            {
                if (assignment.HostId.HasValue || !NameMatches(assignment.HostName, matchers))
                    continue;

                assignment.HostId = hostUserId;
                assignment.HostName = null;
                changed = true;
            }
        }

        return changed;
    }

    private static List<string> BuildMatchers(IEnumerable<string> matchNames)
    {
        var set = new HashSet<string>(StringComparer.Ordinal);
        foreach (var name in matchNames)
        {
            if (string.IsNullOrWhiteSpace(name))
                continue;

            set.Add(NormalizeName(name));
            foreach (var part in name.Split('·', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                set.Add(NormalizeName(part));
        }

        return set.ToList();
    }

    private static bool NameMatches(string? hostName, IReadOnlyList<string> matchers)
    {
        if (string.IsNullOrWhiteSpace(hostName))
            return false;

        var normalized = NormalizeName(hostName);
        if (matchers.Contains(normalized))
            return true;

        foreach (var part in hostName.Split('·', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (matchers.Contains(NormalizeName(part)))
                return true;
        }

        return false;
    }

    private static string NormalizeName(string value) =>
        new string(value.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
}
