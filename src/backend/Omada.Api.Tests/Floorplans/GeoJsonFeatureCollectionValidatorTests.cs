using Omada.Api.Infrastructure.Floorplans;

namespace Omada.Api.Tests.Floorplans;

/// <summary>
/// Thesis verification: GeoJSON FeatureCollection structural conformance (RFC 7946 subset).
/// </summary>
public class GeoJsonFeatureCollectionValidatorTests
{
    [Fact]
    public void TryValidateFeatureCollection_AcceptsNormalizedClosedPolygon()
    {
        const string json = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[0,0],[1,0],[1,1],[0,1],[0,0]]]
                  },
                  "properties": { "roomName": "Lab" }
                }
              ]
            }
            """;

        var valid = GeoJsonFeatureCollectionValidator.TryValidateFeatureCollection(json, out var error);

        Assert.True(valid);
        Assert.Null(error);
    }

    [Fact]
    public void TryValidateFeatureCollection_RejectsOpenRing()
    {
        const string json = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[0,0],[1,0],[1,1],[0,1]]]
                  },
                  "properties": {}
                }
              ]
            }
            """;

        var valid = GeoJsonFeatureCollectionValidator.TryValidateFeatureCollection(json, out var error);

        Assert.False(valid);
        Assert.Contains("closed", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TryValidateFeatureCollection_RejectsCoordinatesOutsideUnitSquare()
    {
        const string json = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[0,0],[1.2,0],[1.2,1],[0,1],[0,0]]]
                  },
                  "properties": {}
                }
              ]
            }
            """;

        var valid = GeoJsonFeatureCollectionValidator.TryValidateFeatureCollection(json, out var error);

        Assert.False(valid);
        Assert.Contains("[0,1]", error, StringComparison.Ordinal);
    }
}
