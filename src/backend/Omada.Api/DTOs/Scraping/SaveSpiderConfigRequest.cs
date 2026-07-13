namespace Omada.Api.DTOs.Scraping;

/// <summary>Persist schedule import crawl URL for the active organization (admin UI).</summary>
public class SaveSpiderConfigRequest
{
    public string? SchedulePageUrl { get; set; }
}
