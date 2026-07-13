namespace Omada.Api.DTOs.Announcements;

public class CreateAnnouncementPostRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
}
