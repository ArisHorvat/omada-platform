namespace Omada.Api.Entities;

/// <summary>
/// AI-derived floorplan overlay for a single <see cref="Floor"/> (one processed upload per floor).
/// </summary>
public class Floorplan : BaseEntity
{
    public Guid FloorId { get; set; }

    /// <summary>Root-relative or absolute URL to the stored floorplan image.</summary>
    public string ImageUrl { get; set; } = null!;

    /// <summary>GeoJSON string (typically a FeatureCollection) for room polygons.</summary>
    public string GeoJsonData { get; set; } = null!;

    public virtual Floor Floor { get; set; } = null!;
}
