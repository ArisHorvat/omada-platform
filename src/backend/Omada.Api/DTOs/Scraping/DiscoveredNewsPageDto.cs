namespace Omada.Api.DTOs.Scraping;

public class DiscoveredNewsPageDto
{
    public required string Url { get; init; }
    public NewsPageKind Kind { get; init; }
}
