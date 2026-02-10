using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IPermissionService
{
    Task<Result<bool>> CanManageGroup(Guid userId, Guid groupId);
    Task<Result<bool>> CanManageAllGroupsInOrg(Guid userId, Guid organizationId);
}