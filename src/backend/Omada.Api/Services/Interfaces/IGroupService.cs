using Omada.Api.DTOs.Groups;
using Omada.Api.Abstractions;

namespace Omada.Api.Services.Interfaces;

public interface IGroupService
{
    Task<ServiceResponse<GroupDto>> CreateGroupAsync(CreateGroupRequest request);
    
    // Changed from Task<object> to Result<AttendanceConfigDto>
    Task<ServiceResponse<AttendanceConfigDto>> GetAttendanceConfigAsync();

    Task<ServiceResponse<IEnumerable<DepartmentSummaryDto>>> GetDepartmentsAsync();
}