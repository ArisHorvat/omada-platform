using Omada.Api.Abstractions;
using Omada.Api.DTOs.Auth;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services.Interfaces;

public interface IAuthService
{
    Task<ServiceResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ServiceResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ServiceResponse<List<UserOrganizationDto>>> GetMyOrganizationsAsync();
    Task<ServiceResponse<LoginResponse>> SwitchOrganizationAsync(SwitchOrgRequest request);
    Task<ServiceResponse<string>> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ServiceResponse<string>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<ServiceResponse<LoginResponse>> VerifyTwoFactorAsync(VerifyTwoFactorRequest request);
    Task<ServiceResponse<string>> ResendTwoFactorCodeAsync(ResendTwoFactorRequest request);
    Task<ServiceResponse<JoinOrganizationResultDto>> JoinOrganizationAsync(JoinOrganizationRequest request);
    Task<ServiceResponse<JoinWithCodeResultDto>> JoinWithInviteCodeAsync(JoinWithInviteCodeRequest request);
    Task<ServiceResponse<List<PendingOrganizationInviteDto>>> GetPendingInvitesAsync();
    Task<ServiceResponse<LoginResponse>> AcceptInviteAsync(InviteCodeRequest request);
    Task<ServiceResponse<bool>> DeclineInviteAsync(InviteCodeRequest request);
    Task<ServiceResponse<OrganizationInvitePreviewDto>> GetInvitePreviewForCurrentUserAsync(string inviteCode);
}