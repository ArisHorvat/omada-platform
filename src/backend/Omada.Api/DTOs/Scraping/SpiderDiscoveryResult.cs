namespace Omada.Api.DTOs.Scraping;

public class SpiderDiscoveryResult
{
    public required string StartUrl { get; init; }
    public required IReadOnlyList<DiscoveredPageDto> Pages { get; init; }
}
