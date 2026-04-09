using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Entities;

namespace Omada.Api.Services;

public class PermissionService : IPermissionService
{
    private readonly IUnitOfWork _uow;
    private readonly ApplicationDbContext _context; // For high-performance Read-Only queries

    public PermissionService(IUnitOfWork uow, ApplicationDbContext context)
    {
        _uow = uow;
        _context = context;
    }

    public async Task<ServiceResponse<bool>> CanManageGroup(Guid userId, Guid groupId)
    {
        var group = await _uow.Repository<Group>().GetByIdAsync(groupId);
        if (group == null) 
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Group not found"));

        if (group.ManagerId == userId) 
            return new ServiceResponse<bool>(true, true);

        return await CanManageAllGroupsInOrg(userId, group.OrganizationId);
    }

    public async Task<ServiceResponse<bool>> CanManageAllGroupsInOrg(Guid userId, Guid organizationId)
    {
        // EF Core projection to get all permissions for the user in the org
        var permissions = await _context.OrganizationMembers
            .AsNoTracking()
            .Where(om => om.UserId == userId && om.OrganizationId == organizationId)
            .SelectMany(om => om.Role.Permissions)
            .ToListAsync();
        
        var hasAccess = permissions.Any(p => 
            (p.WidgetKey == "users" && p.AccessLevel >= AccessLevel.Edit) ||
            (p.WidgetKey == "settings" && p.AccessLevel == AccessLevel.Admin)
        );

        return new ServiceResponse<bool>(true, hasAccess);
    }
}