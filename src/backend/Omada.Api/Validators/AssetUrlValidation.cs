namespace Omada.Api.Validators;

/// <summary>
/// Validates stored URLs for covers and uploads: absolute http(s) or safe root-relative paths (e.g. /news/images/...).
/// </summary>
public static class AssetUrlValidation
{
    public static bool IsValidHttpOrRootRelative(string? uri)
    {
        if (string.IsNullOrWhiteSpace(uri))
            return true;

        if (Uri.TryCreate(uri, UriKind.Absolute, out var abs) &&
            (abs.Scheme == Uri.UriSchemeHttp || abs.Scheme == Uri.UriSchemeHttps))
            return true;

        return uri.StartsWith('/') && !uri.Contains("..", StringComparison.Ordinal);
    }
}
