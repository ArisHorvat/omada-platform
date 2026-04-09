namespace Omada.Api.DTOs.Rooms;

public class CreateRoomRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public int Capacity { get; set; }
    public bool IsBookable { get; set; }
    public List<Guid> AllowedEventTypeIds { get; set; } = new();

    public Guid? BuildingId { get; set; }
    public Guid? FloorId { get; set; }
    public double? CoordinateX { get; set; }
    public double? CoordinateY { get; set; }
    public string? CustomAttributes { get; set; }
    public Guid? RequiredRoleId { get; set; }
}
