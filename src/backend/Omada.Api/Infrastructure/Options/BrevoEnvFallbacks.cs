namespace Omada.Api.Infrastructure.Options;

/// <summary>
/// Maps <c>BREVO_*</c> environment variables when not set via configuration binding.
/// </summary>
public static class BrevoEnvFallbacks
{
    public static void Apply(BrevoOptions options, IConfiguration configuration)
    {
        options.ApiKey ??= configuration["BREVO_API_KEY"]?.Trim();
        if (string.IsNullOrWhiteSpace(options.ApiKey))
            options.ApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY")?.Trim();

        options.SenderEmail ??= configuration["BREVO_SENDER_EMAIL"]?.Trim();
        if (string.IsNullOrWhiteSpace(options.SenderEmail))
            options.SenderEmail = Environment.GetEnvironmentVariable("BREVO_SENDER_EMAIL")?.Trim();

        options.SenderName ??= configuration["BREVO_SENDER_NAME"]?.Trim();
        if (string.IsNullOrWhiteSpace(options.SenderName))
            options.SenderName = Environment.GetEnvironmentVariable("BREVO_SENDER_NAME")?.Trim();
    }
}
