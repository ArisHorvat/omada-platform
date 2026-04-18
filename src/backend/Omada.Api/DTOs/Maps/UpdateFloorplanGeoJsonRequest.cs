using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Maps;

public class UpdateFloorplanGeoJsonRequest
{
    /// <summary>Full GeoJSON FeatureCollection string (normalized [0..1] polygon coordinates).</summary>
    [Required]
    public string GeoJsonData { get; set; } = null!;
}
