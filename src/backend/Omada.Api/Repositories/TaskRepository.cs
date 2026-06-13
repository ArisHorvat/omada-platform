using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class TaskRepository : GenericRepository<TaskItem>, ITaskRepository
{
    public TaskRepository(ApplicationDbContext context)
        : base(context)
    {
    }

    public async Task<PagedResponse<TaskItem>> GetPagedForUserAsync(
        Guid organizationId,
        Guid userId,
        int page,
        int pageSize,
        Guid? groupId = null,
        Guid? offeringId = null)
    {
        var enrolledOfferingIds = await _context.OfferingEnrollments
            .AsNoTracking()
            .Where(e => e.OrganizationId == organizationId && e.UserId == userId && !e.IsDeleted)
            .Select(e => e.OfferingId)
            .ToListAsync();

        var query = _context.Tasks
            .AsNoTracking()
            .Where(t =>
                t.OrganizationId == organizationId &&
                (t.AssigneeId == userId ||
                 t.CreatedByUserId == userId ||
                 (t.OfferingId.HasValue &&
                  !t.AssignmentBatchId.HasValue &&
                  enrolledOfferingIds.Contains(t.OfferingId.Value))));

        if (groupId.HasValue)
            query = query.Where(t => t.SubjectId == groupId.Value);

        if (offeringId.HasValue)
            query = query.Where(t => t.OfferingId == offeringId.Value);

        query = query.OrderByDescending(t => t.CreatedAt);

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
        var task = await _context.Tasks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (task == null)
            return null;

        if (await CanAccessTaskAsync(task, organizationId, userId))
            return task;

        return null;
    }

    public async Task<TaskItem?> GetByIdForUserMutationAsync(Guid id, Guid organizationId, Guid userId)
    {
        var task = await dbSet
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == organizationId);

        if (task == null)
            return null;

        if (await CanAccessTaskAsync(task, organizationId, userId))
            return task;

        return null;
    }

    private async Task<bool> CanAccessTaskAsync(TaskItem task, Guid organizationId, Guid userId)
    {
        if (task.AssigneeId == userId || task.CreatedByUserId == userId)
            return true;

        if (task.OfferingId.HasValue &&
            await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                _context, organizationId, userId, task.OfferingId.Value))
            return true;

        if (!task.OfferingId.HasValue || task.AssignmentBatchId.HasValue)
            return false;

        return await _context.OfferingEnrollments.AsNoTracking()
            .AnyAsync(e =>
                e.OrganizationId == organizationId &&
                e.UserId == userId &&
                e.OfferingId == task.OfferingId.Value &&
                !e.IsDeleted);
    }
}
