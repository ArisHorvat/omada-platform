using Omada.Api.DTOs.Common;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IAttendanceRepository
{
    Task<IReadOnlyList<EventAttendance>> GetUserRecordsAsync(
        Guid organizationId,
        Guid userId,
        Guid? groupId,
        DateTime fromUtc,
        DateTime toUtc,
        int limit,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<EventAttendance>> GetOrgRecordsPagedAsync(
        Guid organizationId,
        int page,
        int pageSize,
        Guid? userId,
        Guid? groupId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default);
}
