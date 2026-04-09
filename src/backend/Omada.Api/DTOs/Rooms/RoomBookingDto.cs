using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Rooms;

public class RoomBookingDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public Guid RoomId { get; set; }

    [Required]
    public Guid BookedByUserId { get; set; }

    [Required]
    public DateTime StartUtc { get; set; }

    [Required]
    public DateTime EndUtc { get; set; }

    public string? Notes { get; set; }
}
