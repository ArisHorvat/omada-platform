using Omada.Api.Entities;

namespace Omada.Api.DTOs.News;

public class CreateNewsItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public NewsType Type { get; set; } = NewsType.Announcement;
    public NewsCategory Category { get; set; } = NewsCategory.General;
}
