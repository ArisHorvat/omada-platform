namespace Omada.Api.DTOs.News;

public class UpdateNewsItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
}
