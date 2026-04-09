namespace Omada.Api.DTOs.Scraping;

public class NewsDiscoveryResult
{
    public required string StartUrl { get; init; }
    public required IReadOnlyList<DiscoveredNewsPageDto> Pages { get; init; }
}
