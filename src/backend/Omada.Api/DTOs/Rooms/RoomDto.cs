using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Rooms;

public class RoomDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Location { get; set; }

    [Required]
    public int Capacity { get; set; }

    [Required]
    public bool IsBookable { get; set; }

    public Guid? BuildingId { get; set; }
    public Guid? FloorId { get; set; }
    public double? CoordinateX { get; set; }
    public double? CoordinateY { get; set; }

    /// <summary>Human-readable amenities line (e.g. comma-separated: projector, whiteboard).</summary>
    public string? Resources { get; set; }

    public string? CustomAttributes { get; set; }

    /// <summary>Canonical amenity keys from <see cref="RoomAmenity"/>.</summary>
    public List<string> Amenities { get; set; } = new();

    public Guid? RequiredRoleId { get; set; }

    [Required]
    public List<EventTypeDto> AllowedEventTypes { get; set; } = new();
}
