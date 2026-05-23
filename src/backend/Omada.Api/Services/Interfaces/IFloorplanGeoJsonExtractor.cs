namespace Omada.Api.Services.Interfaces;

/// <summary>Runs floorplan raster → GeoJSON FeatureCollection (normalized coordinates).</summary>
public interface IFloorplanGeoJsonExtractor
{
    /// <summary>
    /// Returns raw GeoJSON FeatureCollection JSON, or empty collection when inference is not configured or finds nothing.
    /// </summary>
    Task<string> ExtractGeoJsonAsync(byte[] imageBytes, CancellationToken cancellationToken = default);

    bool IsConfigured { get; }
}
