using Omada.Api.Services.Interfaces;
using Omada.Api.Entities;

namespace Omada.Api.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task<Result<bool>> SendInvitationEmailAsync(string email, string firstName, string orgName, string token)
    {
        try 
        {
            // In a real implementation, use SMTP or SendGrid here.
            _logger.LogInformation(">>> SENDING EMAIL TO {Email} <<<", email);
            
            // Return Success
            return Task.FromResult(Result<bool>.Success(true));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", email);
            return Task.FromResult(Result<bool>.Failure(ex.Message));
        }
    }
}