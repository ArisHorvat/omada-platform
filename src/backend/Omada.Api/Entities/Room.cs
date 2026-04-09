namespace Omada.Api.Entities;

public class Room : BaseEntity, IOrganizationScoped
{
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public int Capacity { get; set; }
    /// <summary>Legacy plain-text resources line; prefer <see cref="CustomAttributes"/> for structured equipment.</summary>
    public string? Resources { get; set; }
    /// <summary>JSON payload for equipment and attributes (e.g. projectors, AV).</summary>
    public string? CustomAttributes { get; set; }

    /// <summary>JSON array of <see cref="RoomAmenity"/> names, e.g. ["VideoProjector","VideoConference"].</summary>
    public string? AmenitiesJson { get; set; }
    public bool IsBookable { get; set; } = true;

    public Guid? BuildingId { get; set; }
    public virtual Building? Building { get; set; }

    public Guid? FloorId { get; set; }
    public virtual Floor? Floor { get; set; }

    /// <summary>Normalized or pixel X on floor plan (client convention).</summary>
    public double? CoordinateX { get; set; }
    /// <summary>Normalized or pixel Y on floor plan (client convention).</summary>
    public double? CoordinateY { get; set; }

    /// <summary>When set, only members with this org role may book (see <see cref="OrganizationMember.RoleId"/>).</summary>
    public Guid? RequiredRoleId { get; set; }
    public virtual Role? RequiredRole { get; set; }

    public Guid OrganizationId { get; set; }
    public ICollection<EventType> AllowedEventTypes { get; set; } = new List<EventType>();
    public virtual ICollection<MapPin> MapPins { get; set; } = new List<MapPin>();
    public virtual ICollection<RoomBooking> Bookings { get; set; } = new List<RoomBooking>();
}
