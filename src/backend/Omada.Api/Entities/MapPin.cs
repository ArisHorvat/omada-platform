namespace Omada.Api.Entities;

public class MapPin : BaseEntity
{
    public Guid FloorId { get; set; }
    public PinType PinType { get; set; }
    public string? Label { get; set; }
    public double CoordinateX { get; set; }
    public double CoordinateY { get; set; }
    public Guid? RoomId { get; set; }

    public virtual Floor Floor { get; set; } = null!;
    public virtual Room? Room { get; set; }
}
