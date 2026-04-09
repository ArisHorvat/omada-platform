using Omada.Api.Abstractions;
using Omada.Api.DTOs.Users;
using Omada.Api.DTOs.Common;

namespace Omada.Api.Services.Interfaces;

public interface IUserService
{
    Task<ServiceResponse<UserProfileDto>> GetUserProfileAsync();
    Task<ServiceResponse<PagedResponse<UserDirectoryItemDto>>> GetUserDirectoryAsync(
        PagedRequest request,
        string? q,
        string? role,
        Guid? managerId,
        Guid? departmentId);

    Task<ServiceResponse<UserDeepProfileDto>> GetUserDeepProfileAsync(Guid id);
    Task<ServiceResponse<string>> UpdateProfileAsync(UpdateProfileRequest request);
    Task<ServiceResponse<string>> UpdateMyProfileAsync(UpdateMyProfileRequest request);
    Task<ServiceResponse<string>> UpdateSecurityAsync(UpdateSecurityRequest request);
    Task<ServiceResponse<string>> SoftDeleteMyAccountAsync();
    Task<ServiceResponse<byte[]>> ExportMyDataJsonAsync();
}
