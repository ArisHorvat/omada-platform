using System.Text.Json;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Infrastructure;

public static class ScrapedHostAliasJson
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static List<ScrapedHostAliasDto> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<ScrapedHostAliasDto>();

        try
        {
            return JsonSerializer.Deserialize<List<ScrapedHostAliasDto>>(json, JsonOptions) ?? new List<ScrapedHostAliasDto>();
        }
        catch (JsonException)
        {
            return new List<ScrapedHostAliasDto>();
        }
    }

    public static string Serialize(IReadOnlyList<ScrapedHostAliasDto> aliases)
    {
        var cleaned = aliases
            .Where(a => !string.IsNullOrWhiteSpace(a.ScrapedLabel))
            .Select(a => new ScrapedHostAliasDto
            {
                ScrapedLabel = a.ScrapedLabel.Trim(),
                HostUserId = a.HostUserId is { } id && id != Guid.Empty ? id : null,
                HostDisplayName = string.IsNullOrWhiteSpace(a.HostDisplayName) ? null : a.HostDisplayName.Trim(),
                PendingDisplayName = string.IsNullOrWhiteSpace(a.PendingDisplayName) ? null : a.PendingDisplayName.Trim()
            })
            .ToList();

        return JsonSerializer.Serialize(cleaned, JsonOptions);
    }

    public static Dictionary<string, ScrapedHostAliasDto> IndexByLabel(IReadOnlyList<ScrapedHostAliasDto> aliases) =>
        aliases
            .Where(a => !string.IsNullOrWhiteSpace(a.ScrapedLabel))
            .GroupBy(a => a.ScrapedLabel.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

    public static bool TryGetByLabel(
        IReadOnlyDictionary<string, ScrapedHostAliasDto> aliases,
        string scrapedLabel,
        out ScrapedHostAliasDto? alias)
    {
        alias = null;
        if (string.IsNullOrWhiteSpace(scrapedLabel))
            return false;

        var key = scrapedLabel.Trim();
        if (aliases.TryGetValue(key, out var direct))
        {
            alias = direct;
            return true;
        }

        foreach (var pair in aliases)
        {
            if (!string.Equals(pair.Key, key, StringComparison.OrdinalIgnoreCase))
                continue;
            alias = pair.Value;
            return true;
        }

        return false;
    }

    public static List<ScrapedHostAliasDto> Merge(
        IReadOnlyList<ScrapedHostAliasDto> existing,
        IReadOnlyList<ScrapedHostAliasDto> incoming)
    {
        var map = IndexByLabel(existing);
        foreach (var row in incoming)
        {
            if (string.IsNullOrWhiteSpace(row.ScrapedLabel))
                continue;

            var key = row.ScrapedLabel.Trim();
            if (row.HostUserId is { } hostId && hostId != Guid.Empty)
            {
                map[key] = new ScrapedHostAliasDto
                {
                    ScrapedLabel = key,
                    HostUserId = hostId,
                    HostDisplayName = row.HostDisplayName?.Trim(),
                    PendingDisplayName = null
                };
            }
            else if (!string.IsNullOrWhiteSpace(row.PendingDisplayName))
            {
                map[key] = new ScrapedHostAliasDto
                {
                    ScrapedLabel = key,
                    PendingDisplayName = row.PendingDisplayName.Trim(),
                    HostUserId = null,
                    HostDisplayName = null
                };
            }
            else
            {
                map.Remove(key);
            }
        }

        return map.Values.OrderBy(a => a.ScrapedLabel, StringComparer.OrdinalIgnoreCase).ToList();
    }
}
