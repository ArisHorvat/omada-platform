using Omada.Api.Entities;

namespace Omada.Api.DTOs.News;

public class UpdateNewsRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NewsType Type { get; set; }
    public NewsCategory Category { get; set; } = NewsCategory.General;
    public string? CoverImageUrl { get; set; }
}