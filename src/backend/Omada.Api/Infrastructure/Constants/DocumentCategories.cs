namespace Omada.Api.Infrastructure.Constants;

/// <summary>Corporate document library folders (flat categories, not nested paths).</summary>
public static class DocumentCategories
{
    public const string General = "general";
    public const string Policies = "policies";
    public const string Hr = "hr";
    public const string Templates = "templates";
    public const string Projects = "projects";

    public static readonly IReadOnlyList<string> All =
    [
        General,
        Policies,
        Hr,
        Templates,
        Projects
    ];

    public static bool IsValid(string? category) =>
        !string.IsNullOrWhiteSpace(category) &&
        All.Contains(category.Trim(), StringComparer.OrdinalIgnoreCase);

    public static string Normalize(string? category) =>
        IsValid(category) ? category!.Trim().ToLowerInvariant() : General;
}
