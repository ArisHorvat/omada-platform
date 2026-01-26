namespace Omada.Api.Services.Interfaces;

public interface IPermissionService
{
    Task<bool> CanManageGroup(Guid userId, Guid groupId);
    Task<bool> CanManageAllGroupsInOrg(Guid userId, Guid organizationId);
}