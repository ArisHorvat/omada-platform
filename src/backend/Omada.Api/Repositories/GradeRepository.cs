using Microsoft.EntityFrameworkCore;
using Omada.Api.DTOs.Common;
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
        Guid? groupId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Grades
            .AsNoTracking()
            .Include(g => g.Group)
            .Where(g => g.OrganizationId == organizationId && g.UserId == userId);

        if (groupId.HasValue)
            query = query.Where(g => g.GroupId == groupId.Value);

        return await query
            .OrderByDescending(g => g.Semester)
            .ThenBy(g => g.CourseName)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResponse<Grade>> GetPagedForOrganizationAsync(
        Guid organizationId,
        int page,
        int pageSize,
        Guid? userId,
        string? semester,
        Guid? groupId,
        CancellationToken cancellationToken = default)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

        var query = _context.Grades
            .AsNoTracking()
            .Include(g => g.Group)
            .Include(g => g.User)
            .Where(g => g.OrganizationId == organizationId && !g.IsDeleted);

        if (userId.HasValue)
            query = query.Where(g => g.UserId == userId.Value);

        if (!string.IsNullOrWhiteSpace(semester))
            query = query.Where(g => g.Semester == semester.Trim());

        if (groupId.HasValue)
            query = query.Where(g => g.GroupId == groupId.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(g => g.Semester)
            .ThenBy(g => g.CourseName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<Grade>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
