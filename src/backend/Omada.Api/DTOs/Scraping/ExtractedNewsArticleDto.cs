using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Scraping;

/// <summary>
/// Clean article payload aligned with <see cref="Entities.NewsItem"/> <c>Title</c> and <c>Content</c> (no org/author — set when persisting).
/// </summary>
public class ExtractedNewsArticleDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    public NewsCategory Category { get; set; } = NewsCategory.General;
}
