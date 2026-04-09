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

    public Task<ServiceResponse<bool>> SendInvitationEmailAsync(string email, string firstName, string orgName, string token)
    {
        // In a real implementation, use SMTP or SendGrid here.
        _logger.LogInformation(">>> SENDING EMAIL TO {Email} <<<", email);
        
        return Task.FromResult(new ServiceResponse<bool>(true, true));
    }
}