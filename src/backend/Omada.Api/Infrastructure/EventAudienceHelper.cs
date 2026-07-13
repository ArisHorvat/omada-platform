using System.Text.Json;
using Omada.Api.Entities;

namespace Omada.Api.Infrastructure;

public static class EventAudienceHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static HashSet<Guid> ParseAudienceCohortIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new HashSet<Guid>();

        try
        {
            return (JsonSerializer.Deserialize<List<Guid>>(json, JsonOptions) ?? new List<Guid>()).ToHashSet();
        }
        catch (JsonException)
        {
            return new HashSet<Guid>();
        }
    }

    public static string? SerializeAudienceCohortIds(IEnumerable<Guid>? ids)
    {
        var list = ids?.Where(id => id != Guid.Empty).Distinct().ToList();
        if (list == null || list.Count == 0)
            return null;
        return JsonSerializer.Serialize(list, JsonOptions);
    }

    /// <summary>Whether an offering enrollment should attend / appear on roster for this event.</summary>
    public static bool EnrollmentMatchesEvent(OfferingEnrollment enrollment, Event evt)
    {
        if (evt.CohortGroupId.HasValue)
            return enrollment.CohortGroupId == evt.CohortGroupId;

        var audience = ParseAudienceCohortIds(evt.AudienceCohortGroupIdsJson);
        if (audience.Count == 0)
            return true;

        return enrollment.CohortGroupId.HasValue && audience.Contains(enrollment.CohortGroupId.Value);
    }

    public static bool UserGroupSeesOfferingEvent(
        Event evt,
        IReadOnlyCollection<Guid> userGroupIds,
        IReadOnlyCollection<Guid> enrolledOfferingIds,
        IReadOnlyCollection<Guid>? enrollmentCohortIdsForOffering = null)
    {
        if (!evt.OfferingId.HasValue || !enrolledOfferingIds.Contains(evt.OfferingId.Value))
            return false;

        var enrollmentCohorts = enrollmentCohortIdsForOffering ?? Array.Empty<Guid>();

        if (evt.CohortGroupId.HasValue)
        {
            if (userGroupIds.Contains(evt.CohortGroupId.Value))
                return true;
            return enrollmentCohorts.Contains(evt.CohortGroupId.Value);
        }

        var audience = ParseAudienceCohortIds(evt.AudienceCohortGroupIdsJson);
        if (audience.Count == 0)
            return true;

        if (userGroupIds.Any(audience.Contains))
            return true;

        return enrollmentCohorts.Any(audience.Contains);
    }
}
