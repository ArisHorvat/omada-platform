using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Infrastructure;

public static class OfferingInstructorSync
{
    public static async Task SyncAsync(
        ApplicationDbContext context,
        Guid orgId,
        Guid offeringId,
        List<OfferingInstructorInputDto>? instructors,
        Guid? legacyHostId,
        CancellationToken cancellationToken = default)
    {
        var existing = await context.OfferingInstructors
            .Where(i => i.OfferingId == offeringId)
            .ToListAsync(cancellationToken);
        context.OfferingInstructors.RemoveRange(existing);

        var inputs = instructors?.Where(i => i.UserId != Guid.Empty).ToList() ?? new List<OfferingInstructorInputDto>();
        if (inputs.Count == 0 && legacyHostId.HasValue)
        {
            inputs.Add(new OfferingInstructorInputDto { UserId = legacyHostId.Value, Role = OfferingInstructorRoles.Primary });
        }

        var hasPrimary = inputs.Any(i => OfferingInstructorRoles.Normalize(i.Role) == OfferingInstructorRoles.Primary);
        for (var idx = 0; idx < inputs.Count; idx++)
        {
            var input = inputs[idx];
            var role = OfferingInstructorRoles.Normalize(input.Role);
            if (!hasPrimary && idx == 0)
                role = OfferingInstructorRoles.Primary;

            await context.OfferingInstructors.AddAsync(new OfferingInstructor
            {
                OrganizationId = orgId,
                OfferingId = offeringId,
                UserId = input.UserId,
                Role = role
            }, cancellationToken);
        }

        var offering = await context.CourseOfferings.FirstAsync(o => o.Id == offeringId, cancellationToken);
        offering.HostId = await context.OfferingInstructors.AsNoTracking()
            .Where(i => i.OfferingId == offeringId && i.Role == OfferingInstructorRoles.Primary)
            .Select(i => (Guid?)i.UserId)
            .FirstOrDefaultAsync(cancellationToken) ?? legacyHostId;
        context.CourseOfferings.Update(offering);
    }
}
