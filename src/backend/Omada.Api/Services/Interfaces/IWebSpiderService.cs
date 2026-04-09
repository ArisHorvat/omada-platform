using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Services.Interfaces;

public interface IWebSpiderService
{
    /// <summary>
    /// Breadth-first crawl of in-domain links starting at <paramref name="startUrl"/>.
    /// Classifies each fetched page as menu vs schedule (table with timetable headers).
    /// </summary>
    Task<SpiderDiscoveryResult> DiscoverLinksAsync(string startUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Parses the first schedule-like HTML table and maps rows to <see cref="ScrapedEventDto"/>.
    /// Handles merged <c>rowspan</c>/<c>colspan</c> cells. If the DOM no longer matches or yields zero rows,
    /// falls back to Gemini extraction from stripped page text when configured.
    /// </summary>
    Task<IReadOnlyList<ScrapedEventDto>> ExtractScheduleFromTableAsync(string html, CancellationToken cancellationToken = default);

    /// <summary>
    /// Fetches raw HTML from the schedule page URL (used by Hangfire sync / merge).
    /// </summary>
    Task<string?> FetchSchedulePageHtmlAsync(string url, CancellationToken cancellationToken = default);

    /// <summary>
    /// Crawls in-domain pages starting at <paramref name="startUrl"/>, prioritizing news archive and article URLs
    /// (<c>article</c> tags, common path segments, listing vs single-article heuristics).
    /// </summary>
    Task<NewsDiscoveryResult> DiscoverNewsLinksAsync(string startUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Strips boilerplate (scripts, nav, sidebars, etc.) and returns main headline + body text for mapping to <see cref="Entities.NewsItem"/>.
    /// Optionally categorizes via Gemini when configured.
    /// </summary>
    Task<ExtractedNewsArticleDto> ExtractNewsArticleAsync(string html, CancellationToken cancellationToken = default);
}
