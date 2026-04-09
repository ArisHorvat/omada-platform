namespace Omada.Api.DTOs.Scraping;

public class DiscoveredPageDto
{
    public required string Url { get; init; }
    public SpiderPageKind Kind { get; init; }
}
