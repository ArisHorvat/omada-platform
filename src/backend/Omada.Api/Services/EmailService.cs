using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Omada.Api.Abstractions;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Options;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class EmailService : IEmailService
{
    private const string BrevoHttpClientName = BrevoOptions.HttpClientName;

    private readonly ILogger<EmailService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BrevoOptions _brevo;

    public EmailService(
        ILogger<EmailService> logger,
        IHttpClientFactory httpClientFactory,
        IOptions<BrevoOptions> brevoOptions)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _brevo = brevoOptions.Value;
    }

    public Task<ServiceResponse<bool>> SendInvitationEmailAsync(
        string email,
        string firstName,
        string orgName,
        string inviteLink,
        string inviteCode,
        string? setupToken = null)
    {
        var inviteUrl = BuildInviteUrl(inviteLink, email, setupToken);
        var (subject, textBody, htmlBody) = InviteEmailTemplates.MemberInvitation(firstName, orgName, inviteUrl);
        return SendAsync(email, subject, textBody, htmlBody);
    }

    public Task<ServiceResponse<bool>> SendAdminOnboardingEmailAsync(
        string email,
        string adminFirstName,
        string orgName,
        string inviteLink,
        string inviteCode)
    {
        var body = InviteEmailTemplates.AdminOnboarding(adminFirstName, orgName, inviteLink, inviteCode);
        return SendAsync(email, body);
    }

    public Task<ServiceResponse<bool>> SendJoinWelcomeEmailAsync(string email, string firstName, string orgName)
    {
        var body = InviteEmailTemplates.JoinWelcome(firstName, orgName);
        return SendAsync(email, body);
    }

    private static string BuildInviteUrl(string inviteLink, string email, string? setupToken)
    {
        var url = inviteLink;
        if (!string.IsNullOrEmpty(setupToken))
            url += $"&token={setupToken}";
        url += $"&email={Uri.EscapeDataString(email)}";
        return url;
    }

    private async Task<ServiceResponse<bool>> SendAsync(string email, string body)
    {
        var (subject, textBody) = ParseSubject(body);
        return await SendAsync(email, subject, textBody, ToHtml(textBody));
    }

    private async Task<ServiceResponse<bool>> SendAsync(string email, string subject, string textBody, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(_brevo.ApiKey)
            || string.IsNullOrWhiteSpace(_brevo.SenderEmail))
        {
            LogEmail(email, subject, textBody);
            return new ServiceResponse<bool>(true, true);
        }

        try
        {
            var payload = new
            {
                sender = new
                {
                    email = _brevo.SenderEmail,
                    name = string.IsNullOrWhiteSpace(_brevo.SenderName) ? "Omada" : _brevo.SenderName
                },
                to = new[] { new { email } },
                subject,
                textContent = textBody,
                htmlContent = htmlBody
            };

            var client = _httpClientFactory.CreateClient(BrevoHttpClientName);
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            request.Headers.Add("api-key", _brevo.ApiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "Brevo email failed for {Email} ({StatusCode}): {Body}",
                    email,
                    (int)response.StatusCode,
                    errorBody);
                return new ServiceResponse<bool>(false, false, new AppError(
                    ErrorCodes.OperationFailed,
                    "Could not send email. Check Brevo sender verification and API key."));
            }

            _logger.LogInformation("Email sent via Brevo to {Email}: {Subject}", email, subject);
            return new ServiceResponse<bool>(true, true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Brevo email exception for {Email}", email);
            return new ServiceResponse<bool>(false, false, new AppError(
                ErrorCodes.OperationFailed,
                "Could not send email."));
        }
    }

    private void LogEmail(string email, string subject, string body)
    {
        _logger.LogInformation(">>> EMAIL TO {Email} | {Subject} <<<\n{Body}", email, subject, body);
    }

    private static (string Subject, string Body) ParseSubject(string body)
    {
        const string prefix = "Subject: ";
        var lines = body.Split('\n');
        if (lines.Length > 0 && lines[0].StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            var subject = lines[0][prefix.Length..].Trim();
            var remainder = string.Join('\n', lines.Skip(1)).TrimStart('\n', '\r');
            return (subject, remainder);
        }

        return ("Omada notification", body);
    }

    private static string ToHtml(string textBody)
    {
        var escaped = System.Net.WebUtility.HtmlEncode(textBody);
        var withBreaks = escaped
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\r", "\n", StringComparison.Ordinal)
            .Replace("\n\n", "</p><p>", StringComparison.Ordinal)
            .Replace("\n", "<br/>", StringComparison.Ordinal);

        return $"<html><body style=\"font-family:sans-serif;line-height:1.5;color:#222;\"><p>{withBreaks}</p></body></html>";
    }
}
