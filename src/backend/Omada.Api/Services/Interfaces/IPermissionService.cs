using Omada.Api.Abstractions;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IPermissionService
{
    Task<ServiceResponse<bool>> CanManageGroup(Guid userId, Guid groupId);
    Task<ServiceResponse<bool>> CanManageAllGroupsInOrg(Guid userId, Guid organizationId);
}