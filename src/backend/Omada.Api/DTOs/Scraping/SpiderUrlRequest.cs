using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

/// <summary>Target page for spider preview or discovery. Schedule endpoints may fall back to configured org URL when empty.</summary>
public class SpiderUrlRequest
{
    public string? Url { get; set; }
}
