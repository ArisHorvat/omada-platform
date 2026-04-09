using Omada.Api.Abstractions;
using Omada.Api.DTOs.Auth;

namespace Omada.Api.Services.Interfaces;

public interface IAuthService
{
    Task<ServiceResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ServiceResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ServiceResponse<List<UserOrganizationDto>>> GetMyOrganizationsAsync();
    Task<ServiceResponse<LoginResponse>> SwitchOrganizationAsync(SwitchOrgRequest request);
    Task<ServiceResponse<string>> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ServiceResponse<string>> ResetPasswordAsync(ResetPasswordRequest request);
}