using System.Text.Json;
using Omada.Api.Entities;
using Omada.Api.Services;

namespace Omada.Api.Infrastructure;

public static class OrganizationWidgetKeys
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    /// <summary>Legacy catalog keys merged into <see cref="WidgetKeys.Announcements"/>.</summary>
    private static readonly HashSet<string> LegacyAnnouncementKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        WidgetKeys.Chat,
        WidgetKeys.News,
    };

    private static string NormalizeCatalogKey(string key)
    {
        return LegacyAnnouncementKeys.Contains(key) ? WidgetKeys.Announcements : key;
    }

    public static bool MatchesAudience(WidgetInfo widget, OrganizationType orgType)
    {
        return widget.Audience switch
        {
            WidgetAudience.All => true,
            WidgetAudience.University => orgType == OrganizationType.University,
            WidgetAudience.Corporate => orgType == OrganizationType.Corporate,
            _ => true
        };
    }

    public static IEnumerable<WidgetInfo> GetCatalogWidgets(Organization org) =>
        WidgetRegistry.AvailableWidgets
            .Where(w => w.IsInOrgCatalog && !w.IsCoreFeature && !w.IsAlwaysEnabled)
            .Where(w => MatchesAudience(w, org.OrganizationType));

    public static HashSet<string> GetCatalogKeys(Organization org) =>
        GetCatalogWidgets(org).Select(w => w.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);

    /// <summary>Keys admins may toggle in the org widget catalog (all org types, for validation helpers).</summary>
    public static HashSet<string> GetConfigurableKeys() =>
        WidgetRegistry.AvailableWidgets
            .Where(w => w.IsInOrgCatalog && !w.IsCoreFeature && !w.IsAlwaysEnabled)
            .Select(w => w.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

    public static bool IsCoreWidget(string widgetKey) =>
        WidgetRegistry.AvailableWidgets.Any(w =>
            w.Key.Equals(widgetKey, StringComparison.OrdinalIgnoreCase) && w.IsCoreFeature);

    public static bool IsAlwaysEnabledWidget(string widgetKey) =>
        WidgetRegistry.AvailableWidgets.Any(w =>
            w.Key.Equals(widgetKey, StringComparison.OrdinalIgnoreCase) && w.IsAlwaysEnabled);

    public static bool IsRoleAssignable(WidgetInfo widget) =>
        !widget.IsCoreFeature
        && (widget.IsInOrgCatalog || widget.IsAlwaysEnabled);

    public static HashSet<string>? ParseStoredKeys(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            var keys = JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
            if (keys == null)
                return null;

            return keys
                .Where(k => !string.IsNullOrWhiteSpace(k))
                .Select(k => k.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return null;
        }
    }

    public static string? SerializeStoredKeys(Organization org, IEnumerable<string> keys)
    {
        var catalogKeys = GetCatalogKeys(org);
        var normalized = keys
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => NormalizeCatalogKey(k.Trim()))
            .Where(catalogKeys.Contains)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(k => k, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count == 0)
            return "[]";

        if (normalized.Count == catalogKeys.Count)
            return null;

        return JsonSerializer.Serialize(normalized, JsonOptions);
    }

    public static HashSet<string> GetEffectiveEnabledKeys(Organization org)
    {
        var catalogKeys = GetCatalogKeys(org);
        var stored = ParseStoredKeys(org.EnabledWidgetKeysJson);

        var enabled = stored == null
            ? new HashSet<string>(catalogKeys, StringComparer.OrdinalIgnoreCase)
            : stored.Select(NormalizeCatalogKey).Where(catalogKeys.Contains).ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Legacy orgs may still store chat/news — treat as announcements enabled.
        if (stored != null && stored.Any(k => LegacyAnnouncementKeys.Contains(k)))
            enabled.Add(WidgetKeys.Announcements);

        foreach (var widget in WidgetRegistry.AvailableWidgets.Where(w => w.IsAlwaysEnabled))
            enabled.Add(widget.Key);

        return enabled;
    }

    public static bool IsPermissionAllowedForOrg(Organization org, string widgetKey)
    {
        if (IsCoreWidget(widgetKey) || IsAlwaysEnabledWidget(widgetKey))
            return true;

        return GetEffectiveEnabledKeys(org).Contains(widgetKey);
    }

    public static IEnumerable<string> FilterWidgetKeys(Organization org, IEnumerable<string> widgetKeys)
    {
        var enabled = GetEffectiveEnabledKeys(org);
        return widgetKeys
            .Select(NormalizeCatalogKey)
            .Where(k =>
                IsCoreWidget(k) || IsAlwaysEnabledWidget(k) || enabled.Contains(k))
            .Distinct(StringComparer.OrdinalIgnoreCase);
    }

    public static Dictionary<string, List<string>> FilterRoleWidgetMappings(
        Organization org,
        Dictionary<string, List<string>> mappings)
    {
        return mappings.ToDictionary(
            kvp => kvp.Key,
            kvp => FilterWidgetKeys(org, kvp.Value).ToList(),
            StringComparer.OrdinalIgnoreCase);
    }
}
