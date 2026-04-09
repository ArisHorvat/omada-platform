namespace Omada.Api.Entities;

public class Floor : BaseEntity
{
    public Guid BuildingId { get; set; }
    public int LevelNumber { get; set; }
    public string? FloorplanImageUrl { get; set; }

    public virtual Building Building { get; set; } = null!;
    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
    public virtual ICollection<MapPin> MapPins { get; set; } = new List<MapPin>();

    /// <summary>Optional AI-generated floorplan overlay (one row per floor).</summary>
    public virtual Floorplan? Floorplan { get; set; }
}
