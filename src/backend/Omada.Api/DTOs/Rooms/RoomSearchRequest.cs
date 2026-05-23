using Omada.Api.DTOs.Common;

namespace Omada.Api.DTOs.Rooms;

public class RoomSearchRequest : PagedRequest
{
    public string? SearchTerm { get; set; } // Name or Location
    public int? MinCapacity { get; set; }

    /// <summary>When set, room must be in one of these buildings.</summary>
    public List<Guid>? BuildingIds { get; set; }

    public Guid? EventTypeId { get; set; } // "Does this room support 'Lab'?"

    /// <summary>Room must include every listed amenity (see <see cref="Entities.RoomAmenity"/> names).</summary>
    public List<string>? AmenityKeys { get; set; }

    /// <summary>When set, only rooms on this floor.</summary>
    public Guid? FloorId { get; set; }

    /// <summary>Exact match on <see cref="Room.FloorplanFeatureKey"/> (GeoJSON feature <c>roomId</c>).</summary>
    public string? FloorplanFeatureKey { get; set; }

    // Availability Filter
    public DateTime? AvailableFrom { get; set; }
    public DateTime? AvailableTo { get; set; }
}