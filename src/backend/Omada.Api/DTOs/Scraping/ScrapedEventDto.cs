namespace Omada.Api.DTOs.Scraping;

/// <summary>
/// Output shape from the HTML table extractor (spider). Not mapped to EF; used before merge into <see cref="Entities.ScrapedClassEvent"/>.
/// </summary>
public class ScrapedEventDto
{
    public string ClassName { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string Professor { get; set; } = string.Empty;
    public string GroupNumber { get; set; } = string.Empty;
}
