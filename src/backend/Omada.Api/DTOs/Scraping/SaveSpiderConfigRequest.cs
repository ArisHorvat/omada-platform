namespace Omada.Api.DTOs.Scraping;

/// <summary>Persist spider crawl entry URLs for the active organization (admin UI).</summary>
public class SaveSpiderConfigRequest
{
    public string? SchedulePageUrl { get; set; }
    public string? NewsStartUrl { get; set; }
}
