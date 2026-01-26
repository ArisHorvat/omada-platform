using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendInvitationEmailAsync(string email, string firstName, string orgName, string token)
    {
        // In a real implementation, use SMTP or SendGrid here.
        _logger.LogInformation(">>> SENDING EMAIL TO {Email} <<<\nSubject: Welcome to {OrgName}\nBody: Hi {Name}, you have been invited to join {OrgName}. Click here to set your password: https://omada.app/reset-password?token={Token}", email, orgName, firstName, orgName, token);
        return Task.CompletedTask;
    }
}