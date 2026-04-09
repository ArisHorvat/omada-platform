namespace Omada.Api.DTOs.Scraping;

/// <summary>
/// Batched entity-resolution results for a scrape pass (professor → user, room text → room).
/// Keys use the same normalization as schedule spider merge (whitespace-collapsed, case-insensitive).
/// </summary>
public sealed class ScrapedEventResolutionMaps
{
    public Dictionary<string, Guid?> HostByProfessorKey { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, Guid?> RoomByRoomTextKey { get; init; } = new(StringComparer.OrdinalIgnoreCase);
}
