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

    public static HashSet<string> GetConfigurableKeys()
    {
        return WidgetRegistry.AvailableWidgets
            .Where(w => !w.IsCoreFeature)
            .Select(w => w.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsCoreWidget(string widgetKey) =>
        WidgetRegistry.AvailableWidgets.Any(w =>
            w.Key.Equals(widgetKey, StringComparison.OrdinalIgnoreCase) && w.IsCoreFeature);

    public static HashSet<string>? ParseStoredKeys(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            var keys = JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
            if (keys == null || keys.Count == 0)
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

    public static string? SerializeStoredKeys(IEnumerable<string> keys)
    {
        var normalized = keys
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .Where(k => GetConfigurableKeys().Contains(k))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(k => k, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count == 0 || normalized.Count == GetConfigurableKeys().Count)
            return null;

        return JsonSerializer.Serialize(normalized, JsonOptions);
    }

    public static HashSet<string> GetEffectiveEnabledKeys(Organization org)
    {
        var stored = ParseStoredKeys(org.EnabledWidgetKeysJson);
        return stored ?? GetConfigurableKeys();
    }

    public static IEnumerable<string> FilterWidgetKeys(Organization org, IEnumerable<string> widgetKeys)
    {
        var enabled = GetEffectiveEnabledKeys(org);
        return widgetKeys.Where(k => IsCoreWidget(k) || enabled.Contains(k));
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
