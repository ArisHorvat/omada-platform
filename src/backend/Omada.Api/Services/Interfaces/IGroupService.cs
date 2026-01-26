using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public record CreateGroupRequest(Guid OrganizationId, string Name, string Type, Guid? ManagerId, Guid? ParentGroupId, string? ScheduleConfig);

public interface IGroupService
{
    Task<Result<Group>> CreateGroupAsync(CreateGroupRequest request);
    Task<object> GetAttendanceConfigAsync(Guid userId, Guid organizationId);
}
