using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class GradeRepository : GenericRepository<Grade>, IGradeRepository
{
    public GradeRepository(ApplicationDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<Grade>> GetForUserAsync(
        Guid organizationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Grades
            .AsNoTracking()
            .Where(g => g.OrganizationId == organizationId && g.UserId == userId)
            .OrderByDescending(g => g.Semester)
            .ThenBy(g => g.CourseName)
            .ToListAsync(cancellationToken);
    }
}
