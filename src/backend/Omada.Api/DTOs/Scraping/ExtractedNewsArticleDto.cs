using Omada.Api.Entities;

namespace Omada.Api.DTOs.Scraping;

/// <summary>
/// Clean article payload aligned with <see cref="Entities.NewsItem"/> <c>Title</c> and <c>Content</c> (no org/author — set when persisting).
/// </summary>
public class ExtractedNewsArticleDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NewsCategory Category { get; set; } = NewsCategory.General;
}
