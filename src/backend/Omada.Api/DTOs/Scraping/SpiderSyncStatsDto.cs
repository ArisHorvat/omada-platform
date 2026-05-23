namespace Omada.Api.DTOs.Scraping;

public class SpiderSyncStatsDto
{
    public int Processed { get; set; }
    public int Created { get; set; }
    public int Updated { get; set; }
    public int Removed { get; set; }
    public int Skipped { get; set; }
}
