using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;

    public AuditLogService(IUnitOfWork uow, IUserContext userContext)
    {
        _uow = uow;
        _userContext = userContext;
    }

    public async Task RecordAsync(
        Guid organizationId,
        Guid actorUserId,
        string action,
        string summary,
        string? entityType = null,
        Guid? entityId = null,
        string? detailsJson = null)
    {
        var entry = new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = actorUserId,
            Action = action.Trim(),
            Summary = summary.Trim(),
            EntityType = entityType,
            EntityId = entityId,
            DetailsJson = detailsJson
        };

        await _uow.Repository<AuditLog>().AddAsync(entry);
        await _uow.CompleteAsync();
    }

    public async Task<ServiceResponse<PagedResponse<AuditLogDto>>> GetForCurrentOrganizationAsync(PagedRequest request)
    {
        var orgId = _userContext.OrganizationId;
        return await QueryAsync(request, orgId);
    }

    public async Task<ServiceResponse<PagedResponse<AuditLogDto>>> GetPlatformWideAsync(
        PagedRequest request,
        Guid? organizationId)
    {
        return await QueryAsync(request, organizationId);
    }

    private async Task<ServiceResponse<PagedResponse<AuditLogDto>>> QueryAsync(PagedRequest request, Guid? organizationId)
    {
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 25 : Math.Min(request.PageSize, 100);

        var query =
            from log in _uow.Repository<AuditLog>().GetQueryable().AsNoTracking()
            join user in _uow.Repository<User>().GetQueryable().AsNoTracking() on log.ActorUserId equals user.Id
            join org in _uow.Repository<Organization>().GetQueryable().AsNoTracking() on log.OrganizationId equals org.Id
            where !log.IsDeleted
            select new { Log = log, User = user, Org = org };

        if (organizationId.HasValue)
            query = query.Where(x => x.Log.OrganizationId == organizationId.Value);

        var total = await query.CountAsync();
        var rows = await query
            .OrderByDescending(x => x.Log.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = rows.Select(x => new AuditLogDto
        {
            Id = x.Log.Id,
            OrganizationId = x.Log.OrganizationId,
            OrganizationName = x.Org.Name,
            ActorUserId = x.Log.ActorUserId,
            ActorName = $"{x.User.FirstName} {x.User.LastName}".Trim(),
            Action = x.Log.Action,
            EntityType = x.Log.EntityType,
            EntityId = x.Log.EntityId,
            Summary = x.Log.Summary,
            CreatedAt = x.Log.CreatedAt
        }).ToList();

        return new ServiceResponse<PagedResponse<AuditLogDto>>(true, new PagedResponse<AuditLogDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }
}
