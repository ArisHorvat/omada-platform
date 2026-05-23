namespace Omada.Api.Infrastructure.Options;

/// <summary>
/// Optional <c>GEMINI_API_KEY</c> alias for <c>Gemini:ApiKey</c> when not set via configuration.
/// </summary>
public static class GeminiEnvFallbacks
{
    public static string? ResolveApiKey(IConfiguration configuration)
    {
        var fromConfig = configuration["Gemini:ApiKey"]?.Trim();
        if (!string.IsNullOrEmpty(fromConfig))
            return fromConfig;

        return Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim();
    }
}
