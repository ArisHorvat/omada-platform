using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;
using Omada.Api.Abstractions;

namespace Omada.Api.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task<ServiceResponse<bool>> SendInvitationEmailAsync(
        string email,
        string firstName,
        string orgName,
        string inviteLink,
        string inviteCode,
        string? setupToken = null)
    {
        var body = InviteEmailTemplates.MemberInvitation(firstName, orgName, inviteLink, inviteCode);
        if (!string.IsNullOrEmpty(setupToken))
        {
            body += $"\n\nSet your password using this secure link (valid 7 days):\n{inviteLink}&token={setupToken}";
        }

        LogEmail(email, body);
        return Task.FromResult(new ServiceResponse<bool>(true, true));
    }

    public Task<ServiceResponse<bool>> SendAdminOnboardingEmailAsync(
        string email,
        string adminFirstName,
        string orgName,
        string inviteLink,
        string inviteCode)
    {
        var body = InviteEmailTemplates.AdminOnboarding(adminFirstName, orgName, inviteLink, inviteCode);
        LogEmail(email, body);
        return Task.FromResult(new ServiceResponse<bool>(true, true));
    }

    public Task<ServiceResponse<bool>> SendJoinWelcomeEmailAsync(string email, string firstName, string orgName)
    {
        var body = InviteEmailTemplates.JoinWelcome(firstName, orgName);
        LogEmail(email, body);
        return Task.FromResult(new ServiceResponse<bool>(true, true));
    }

    private void LogEmail(string email, string body)
    {
        _logger.LogInformation(">>> EMAIL TO {Email} <<<\n{Body}", email, body);
    }
}
