using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Rooms;

public class MapPinDto
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    public Guid FloorId { get; set; }

    [Required]
    public PinType PinType { get; set; }

    public string? Label { get; set; }

    [Required]
    public double CoordinateX { get; set; }

    [Required]
    public double CoordinateY { get; set; }

    public Guid? RoomId { get; set; }
}
