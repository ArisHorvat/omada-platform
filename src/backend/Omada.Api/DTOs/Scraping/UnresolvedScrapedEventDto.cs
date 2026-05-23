using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Scraping;

public class UnresolvedScrapedEventDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string ClassName { get; set; }

    [Required]
    public required string Professor { get; set; }

    [Required]
    public required string RoomText { get; set; }

    [Required]
    public required string Time { get; set; }

    [Required]
    public required string GroupNumber { get; set; }

    public bool MissingHost { get; set; }
    public bool MissingRoom { get; set; }
}
