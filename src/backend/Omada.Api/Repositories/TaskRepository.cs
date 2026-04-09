using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class TaskRepository : GenericRepository<TaskItem>, ITaskRepository
{
    public TaskRepository(ApplicationDbContext context)
        : base(context)
    {
    }

    public async Task<PagedResponse<TaskItem>> GetPagedForUserAsync(Guid organizationId, Guid userId, int page, int pageSize)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Where(t =>
                t.OrganizationId == organizationId &&
                (t.AssigneeId == userId || t.CreatedByUserId == userId))
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<TaskItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<TaskItem?> GetByIdForUserReadAsync(Guid id, Guid organizationId, Guid userId)
    {
        return await _context.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.Id == id &&
                t.OrganizationId == organizationId &&
                (t.AssigneeId == userId || t.CreatedByUserId == userId));
    }

    public async Task<TaskItem?> GetByIdForUserMutationAsync(Guid id, Guid organizationId, Guid userId)
    {
        return await dbSet
            .FirstOrDefaultAsync(t =>
                t.Id == id &&
                t.OrganizationId == organizationId &&
                (t.AssigneeId == userId || t.CreatedByUserId == userId));
    }
}
