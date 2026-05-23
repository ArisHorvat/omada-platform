using Omada.Api.DTOs.Common;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IGradeRepository : IGenericRepository<Grade>
{
    /// <summary>
    /// Grades for a single student in the current organization. Caller must pass the authenticated user id.
    /// </summary>
    Task<IReadOnlyList<Grade>> GetForUserAsync(
        Guid organizationId,
        Guid userId,
        Guid? groupId = null,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<Grade>> GetPagedForOrganizationAsync(
        Guid organizationId,
        int page,
        int pageSize,
        Guid? userId,
        string? semester,
        Guid? groupId,
        CancellationToken cancellationToken = default);
}
