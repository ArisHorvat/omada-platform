using Omada.Api.Entities;

namespace Omada.Api.Infrastructure;

/// <summary>Preloaded membership/enrollment context for "My schedule" visibility.</summary>
public sealed class ScheduleUserVisibilityContext
{
    public required Guid UserId { get; init; }

    public HashSet<Guid> UserGroupIds { get; init; } = new();

    public HashSet<Guid> EnrolledOfferingIds { get; init; } = new();

    /// <summary>OfferingId → cohort group ids from enrollments.</summary>
    public Dictionary<Guid, HashSet<Guid>> EnrollmentCohortIdsByOffering { get; init; } = new();

    public HashSet<Guid> TeachingOfferingIds { get; init; } = new();

    public HashSet<Guid> EnrollmentCohortsForOffering(Guid? offeringId)
    {
        if (!offeringId.HasValue)
            return new HashSet<Guid>();
        return EnrollmentCohortIdsByOffering.TryGetValue(offeringId.Value, out var set)
            ? set
            : new HashSet<Guid>();
    }

    public bool IsEventVisible(Event evt)
    {
        if (evt.HostId == UserId)
            return true;

        if (evt.OfferingId.HasValue && TeachingOfferingIds.Contains(evt.OfferingId.Value))
            return true;

        if (evt.GroupId.HasValue && UserGroupIds.Contains(evt.GroupId.Value))
            return true;

        if (evt.CohortGroupId.HasValue && UserGroupIds.Contains(evt.CohortGroupId.Value))
            return true;

        if (evt.OfferingId.HasValue && EnrolledOfferingIds.Contains(evt.OfferingId.Value))
        {
            var enrollmentCohorts = EnrollmentCohortsForOffering(evt.OfferingId);
            if (EventAudienceHelper.UserGroupSeesOfferingEvent(evt, UserGroupIds, EnrolledOfferingIds, enrollmentCohorts))
                return true;
        }

        return evt.Attendances.Any(a => a.UserId == UserId &&
            (a.Status == AttendanceStatus.Added || a.Status == AttendanceStatus.Expected));
    }
}
