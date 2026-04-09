namespace Omada.Api.Infrastructure;

/// <summary>Validates stored media paths: root-relative only, no absolute URLs in the database.</summary>
public static class RelativeWebPath
{
    public static bool IsValidOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return true;
        var t = value.Trim();
        if (t.Contains("://", StringComparison.Ordinal))
            return false;
        return t.StartsWith('/') && t.Length > 1;
    }
}
