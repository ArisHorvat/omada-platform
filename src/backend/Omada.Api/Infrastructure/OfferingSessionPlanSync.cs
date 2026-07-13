using Omada.Api.DTOs.Offerings;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Infrastructure;

/// <summary>
/// Keeps offering teaching-team metadata aligned with <see cref="OfferingSessionPlanJson"/>.
/// </summary>
public static class OfferingSessionPlanSync
{
  public static List<OfferingInstructorInputDto> DeriveInstructorInputs(
      IReadOnlyList<OfferingWeeklySessionDto> sessions,
      Guid? preferredPrimaryHostId)
  {
    var hostIds = CollectHostIds(sessions);
    if (hostIds.Count == 0)
      return new List<OfferingInstructorInputDto>();

    var primary = preferredPrimaryHostId is { } preferred && hostIds.Contains(preferred)
        ? preferred
        : hostIds.FirstOrDefault(id => sessions.Any(s => s.HostId == id)) is var sessionHost && sessionHost != Guid.Empty
          ? sessionHost
          : hostIds[0];

    var inputs = new List<OfferingInstructorInputDto>
    {
      new() { UserId = primary, Role = OfferingInstructorRoles.Primary }
    };

    foreach (var hostId in hostIds)
    {
      if (hostId == primary)
        continue;

      inputs.Add(new OfferingInstructorInputDto
      {
        UserId = hostId,
        Role = OfferingInstructorRoles.CoInstructor
      });
    }

    return inputs;
  }

  public static IReadOnlyList<Guid> CollectHostIds(IReadOnlyList<OfferingWeeklySessionDto> sessions)
  {
    var seen = new HashSet<Guid>();
    var ordered = new List<Guid>();

    foreach (var session in sessions)
    {
      TryAddHost(session.HostId);
      if (session.AssignedInstructorIds != null)
      {
        foreach (var id in session.AssignedInstructorIds)
          TryAddHost(id);
      }
      if (session.CohortAssignments == null)
        continue;

      foreach (var assignment in session.CohortAssignments)
        TryAddHost(assignment.HostId);
    }

    return ordered;

    void TryAddHost(Guid? hostId)
    {
      if (hostId is not { } id || id == Guid.Empty || !seen.Add(id))
        return;

      ordered.Add(id);
    }
  }
}
