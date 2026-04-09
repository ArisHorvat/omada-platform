using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface IGradeRepository : IGenericRepository<Grade>
{
    /// <summary>
    /// Grades for a single student in the current organization. Caller must pass the authenticated user id.
    /// </summary>
    Task<IReadOnlyList<Grade>> GetForUserAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken = default);
}
