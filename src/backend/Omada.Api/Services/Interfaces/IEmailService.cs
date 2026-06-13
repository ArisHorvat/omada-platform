using Omada.Api.Abstractions;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IEmailService
{
    Task<ServiceResponse<bool>> SendInvitationEmailAsync(string email, string firstName, string orgName, string inviteLink, string inviteCode, string? setupToken = null);
    Task<ServiceResponse<bool>> SendAdminOnboardingEmailAsync(string email, string adminFirstName, string orgName, string inviteLink, string inviteCode);
    Task<ServiceResponse<bool>> SendJoinWelcomeEmailAsync(string email, string firstName, string orgName);
    Task<ServiceResponse<bool>> SendPasswordResetEmailAsync(string email, string firstName, string resetLink);
    Task<ServiceResponse<bool>> SendTwoFactorCodeEmailAsync(string email, string firstName, string code);
}