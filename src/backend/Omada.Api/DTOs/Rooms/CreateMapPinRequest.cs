using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Rooms;

public class CreateMapPinRequest
{
    public Guid? RoomId { get; set; }

    [Range(0, 1)]
    public double CoordinateX { get; set; }

    [Range(0, 1)]
    public double CoordinateY { get; set; }

    public PinType? PinType { get; set; }

    public bool IsEntrance { get; set; }

    [MaxLength(120)]
    public string? Label { get; set; }
}

