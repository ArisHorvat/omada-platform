namespace Omada.Api.Infrastructure;

/// <summary>
/// Turns root-relative static paths (e.g. /images/avatars/…) into absolute URLs clients can load.
/// Prefer <c>AppConfig:BaseUrl</c> when set (LAN / reverse proxy); otherwise uses the current HTTP request.
/// </summary>
public interface IPublicMediaUrlResolver
{
    string? ToPublicUrl(string? pathOrAbsoluteUrl);
}

public sealed class PublicMediaUrlResolver : IPublicMediaUrlResolver
{
    private readonly IHttpContextAccessor _http;
    private readonly IConfiguration _configuration;

    public PublicMediaUrlResolver(IHttpContextAccessor http, IConfiguration configuration)
    {
        _http = http;
        _configuration = configuration;
    }

    public string? ToPublicUrl(string? pathOrAbsoluteUrl)
    {
        if (string.IsNullOrWhiteSpace(pathOrAbsoluteUrl))
            return null;

        var t = pathOrAbsoluteUrl.Trim();
        if (t.Contains("://", StringComparison.OrdinalIgnoreCase))
            return t;

        var baseUrl = _configuration["AppConfig:BaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrEmpty(baseUrl))
        {
            var req = _http.HttpContext?.Request;
            if (req != null)
                baseUrl = $"{req.Scheme}://{req.Host.Value}".TrimEnd('/');
        }

        if (string.IsNullOrEmpty(baseUrl))
            return t.StartsWith('/') ? t : "/" + t;

        return t.StartsWith('/') ? $"{baseUrl}{t}" : $"{baseUrl}/{t}";
    }
}
