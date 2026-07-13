namespace Omada.Api.Infrastructure;

/// <summary>
/// CORS for API + SignalR. SignalR negotiate sends credentials when a JWT is used,
/// so wildcard origins are invalid — explicit origins with AllowCredentials are required.
/// </summary>
public static class CorsOriginPolicy
{
    public const string PolicyName = "AllowAll";

    public static void Configure(WebApplicationBuilder builder)
    {
        var configuredOrigins = GetConfiguredOrigins(builder.Configuration);
        var isDevelopment = builder.Environment.IsDevelopment();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                policy
                    .SetIsOriginAllowed(origin => IsOriginAllowed(origin, isDevelopment, configuredOrigins))
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
    }

    private static HashSet<string> GetConfiguredOrigins(IConfiguration configuration)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void Add(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return;

            set.Add(url.Trim().TrimEnd('/'));
        }

        Add(configuration["AppConfig:PublicAppUrl"]);
        Add(configuration["AppConfig:BaseUrl"]);

        var extra = configuration["AppConfig:CorsOrigins"] ?? configuration["CORS_ORIGINS"];
        if (!string.IsNullOrWhiteSpace(extra))
        {
            foreach (var part in extra.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                Add(part);
        }

        Add("http://localhost:8081");
        Add("http://127.0.0.1:8081");

        return set;
    }

    private static bool IsOriginAllowed(string origin, bool isDevelopment, HashSet<string> configuredOrigins)
    {
        if (string.IsNullOrWhiteSpace(origin))
            return false;

        var normalized = origin.Trim().TrimEnd('/');
        if (configuredOrigins.Contains(normalized))
            return true;

        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
            return false;

        if (uri.Host is "localhost" or "127.0.0.1")
            return true;

        if (isDevelopment && IsPrivateNetworkHost(uri.Host))
            return true;

        return false;
    }

    private static bool IsPrivateNetworkHost(string host)
    {
        if (host.StartsWith("192.168.", StringComparison.Ordinal))
            return true;

        if (host.StartsWith("10.", StringComparison.Ordinal))
            return true;

        if (!host.StartsWith("172.", StringComparison.Ordinal))
            return false;

        var parts = host.Split('.');
        return parts.Length >= 2
               && int.TryParse(parts[1], out var second)
               && second is >= 16 and <= 31;
    }
}
