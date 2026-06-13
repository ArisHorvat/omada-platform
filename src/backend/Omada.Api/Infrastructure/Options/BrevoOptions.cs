namespace Omada.Api.Infrastructure.Options;

public class BrevoOptions
{
    public const string SectionName = "Brevo";
    public const string HttpClientName = "Brevo";

    public string? ApiKey { get; set; }
    public string? SenderEmail { get; set; }
    public string? SenderName { get; set; }
}
