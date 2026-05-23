using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Groups;
using Omada.Api.Abstractions;

namespace Omada.Api.Services.Interfaces;

public interface IGroupService
{
    Task<ServiceResponse<GroupDto>> CreateGroupAsync(CreateGroupRequest request);
    Task<ServiceResponse<GroupDto>> UpdateGroupAsync(Guid id, UpdateGroupRequest request);
    Task<ServiceResponse<bool>> DeleteGroupAsync(Guid id);
    Task<ServiceResponse<GroupDetailDto>> GetGroupByIdAsync(Guid id);
    Task<ServiceResponse<IEnumerable<GroupTreeNodeDto>>> GetGroupTreeAsync();
    Task<ServiceResponse<IEnumerable<GroupTypeOptionDto>>> GetGroupTypeCatalogAsync();
    Task<ServiceResponse<IEnumerable<GroupPickerItemDto>>> GetAssignableGroupsAsync(string context);
    Task<ServiceResponse<AttendanceConfigDto>> GetAttendanceConfigAsync();
    Task<string> GetOrganizationKindAsync(Guid organizationId, CancellationToken cancellationToken = default);
    Task<ServiceResponse<IEnumerable<DepartmentSummaryDto>>> GetDepartmentsAsync();
    Task<ServiceResponse<PagedResponse<GroupMemberDto>>> GetGroupMembersAsync(Guid groupId, PagedRequest request, string? q);
    Task<ServiceResponse<int>> AddGroupMembersAsync(Guid groupId, AddGroupMembersRequest request);
    Task<ServiceResponse<bool>> RemoveGroupMemberAsync(Guid groupId, Guid userId);
    Task<ServiceResponse<int>> MoveGroupMembersAsync(MoveGroupMembersRequest request);
}
