namespace Omada.Api.Entities;

public class Building : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Engineering Hall"
    public string? ShortCode { get; set; } // e.g. "ENG"
    public string? Address { get; set; }
    
    // 🚀 For Future Map Feature
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Navigation
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
    public virtual ICollection<Floor> Floors { get; set; } = new List<Floor>();
}