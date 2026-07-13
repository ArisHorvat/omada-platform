using System.Text.Json;

namespace Omada.Api.Infrastructure.Floorplans;

/// <summary>
/// Lightweight RFC 7946 structural checks for floorplan FeatureCollection payloads.
/// </summary>
public static class GeoJsonFeatureCollectionValidator
{
    public static bool TryValidateFeatureCollection(string json, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(json))
        {
            error = "GeoJSON payload is empty.";
            return false;
        }

        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException ex)
        {
            error = ex.Message;
            return false;
        }

        using (doc)
        {
            var root = doc.RootElement;
            if (!root.TryGetProperty("type", out var typeEl) || typeEl.GetString() != "FeatureCollection")
            {
                error = "Root type must be FeatureCollection.";
                return false;
            }

            if (!root.TryGetProperty("features", out var features) || features.ValueKind != JsonValueKind.Array)
            {
                error = "FeatureCollection must contain a features array.";
                return false;
            }

            foreach (var feature in features.EnumerateArray())
            {
                if (!TryValidateFeature(feature, out error))
                    return false;
            }
        }

        return true;
    }

    private static bool TryValidateFeature(JsonElement feature, out string? error)
    {
        error = null;
        if (!feature.TryGetProperty("type", out var typeEl) || typeEl.GetString() != "Feature")
        {
            error = "Feature type must be Feature.";
            return false;
        }

        if (!feature.TryGetProperty("geometry", out var geometry))
        {
            error = "Feature is missing geometry.";
            return false;
        }

        if (!geometry.TryGetProperty("type", out var geomType) || geomType.GetString() != "Polygon")
        {
            error = "Floorplan geometry type must be Polygon.";
            return false;
        }

        if (!geometry.TryGetProperty("coordinates", out var coordinates) || coordinates.ValueKind != JsonValueKind.Array)
        {
            error = "Polygon geometry must include coordinates.";
            return false;
        }

        if (coordinates.GetArrayLength() == 0)
        {
            error = "Polygon coordinates must contain at least one ring.";
            return false;
        }

        var ring = coordinates[0];
        if (ring.ValueKind != JsonValueKind.Array || ring.GetArrayLength() < 4)
        {
            error = "Polygon ring must contain at least four positions (closed ring).";
            return false;
        }

        var first = ring[0];
        var last = ring[ring.GetArrayLength() - 1];
        if (!PositionsEqual(first, last))
        {
            error = "Polygon ring must be closed (first position equals last).";
            return false;
        }

        foreach (var position in ring.EnumerateArray())
        {
            if (position.ValueKind != JsonValueKind.Array || position.GetArrayLength() < 2)
            {
                error = "Each position must be a numeric [x, y] pair.";
                return false;
            }

            if (!position[0].TryGetDouble(out var x) || !position[1].TryGetDouble(out var y))
            {
                error = "Coordinate values must be numbers.";
                return false;
            }

            if (x < 0 || x > 1 || y < 0 || y > 1)
            {
                error = "Normalized coordinates must be within [0,1].";
                return false;
            }
        }

        return true;
    }

    private static bool PositionsEqual(JsonElement a, JsonElement b)
    {
        if (a.ValueKind != JsonValueKind.Array || b.ValueKind != JsonValueKind.Array)
            return false;
        if (a.GetArrayLength() < 2 || b.GetArrayLength() < 2)
            return false;
        return a[0].GetDouble() == b[0].GetDouble() && a[1].GetDouble() == b[1].GetDouble();
    }
}
