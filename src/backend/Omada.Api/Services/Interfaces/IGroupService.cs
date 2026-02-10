using Omada.Api.Entities;
using Omada.Api.DTOs.Groups; // Add this using

namespace Omada.Api.Services.Interfaces;

public interface IGroupService
{
    Task<Result<Group>> CreateGroupAsync(CreateGroupRequest request);
    
    // Changed from Task<object> to Result<AttendanceConfigDto>
    Task<Result<AttendanceConfigDto>> GetAttendanceConfigAsync(Guid userId, Guid organizationId);
}