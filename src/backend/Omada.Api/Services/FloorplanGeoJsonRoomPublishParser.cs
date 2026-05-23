using System.Text.Json;
using System.Text.RegularExpressions;

namespace Omada.Api.Services;

/// <summary>
/// Reads polygon features from stored floorplan GeoJSON for publishing to <see cref="Entities.Room"/> rows.
/// </summary>
public static class FloorplanGeoJsonRoomPublishParser
{
    public sealed record PolygonPublishCandidate(
        string RoomName,
        string RoomId,
        double CentroidX,
        double CentroidY,
        bool IsBookable,
        string? MapIconKey);

    public static IReadOnlyList<PolygonPublishCandidate> ExtractPublishablePolygons(string geoJsonData)
    {
        if (string.IsNullOrWhiteSpace(geoJsonData))
            return Array.Empty<PolygonPublishCandidate>();

        try
        {
            using var doc = JsonDocument.Parse(geoJsonData.Trim());
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("features", out var features)
                || features.ValueKind != JsonValueKind.Array)
                return Array.Empty<PolygonPublishCandidate>();

            var list = new List<PolygonPublishCandidate>();
            foreach (var feature in features.EnumerateArray())
            {
                var candidate = TryParsePolygonFeature(feature);
                if (candidate != null)
                    list.Add(candidate);
            }

            return list;
        }
        catch (JsonException)
        {
            return Array.Empty<PolygonPublishCandidate>();
        }
    }

    private static PolygonPublishCandidate? TryParsePolygonFeature(JsonElement feature)
    {
        if (!feature.TryGetProperty("geometry", out var geom) || geom.ValueKind != JsonValueKind.Object)
            return null;
        if (!geom.TryGetProperty("type", out var gt) || !string.Equals(gt.GetString(), "Polygon", StringComparison.OrdinalIgnoreCase))
            return null;
        if (!geom.TryGetProperty("coordinates", out var coords) || coords.ValueKind != JsonValueKind.Array || coords.GetArrayLength() == 0)
            return null;
        var ring = coords[0];
        if (ring.ValueKind != JsonValueKind.Array || ring.GetArrayLength() < 4)
            return null;

        var pts = new List<(double X, double Y)>();
        foreach (var p in ring.EnumerateArray())
        {
            if (p.ValueKind != JsonValueKind.Array || p.GetArrayLength() < 2) continue;
            var x = p[0].GetDouble();
            var y = p[1].GetDouble();
            if (double.IsFinite(x) && double.IsFinite(y))
                pts.Add((Clamp01(x), Clamp01(y)));
        }

        if (pts.Count < 3)
            return null;

        var props = feature.TryGetProperty("properties", out var pr) && pr.ValueKind == JsonValueKind.Object
            ? pr
            : default;

        var roomName = ReadStringProp(props, "roomName")?.Trim();
        if (string.IsNullOrEmpty(roomName))
            roomName = "Room";

        if (ShouldSkipByName(roomName))
            return null;

        var roomId = ReadStringProp(props, "roomId")?.Trim();
        if (string.IsNullOrEmpty(roomId))
            roomId = Guid.NewGuid().ToString("N");

        var (cx, cy) = Centroid(pts);
        var mapIconKey = ReadStringProp(props, "mapIconKey");
        if (string.IsNullOrWhiteSpace(mapIconKey))
            mapIconKey = null;
        else
        {
            mapIconKey = mapIconKey.Trim();
            if (mapIconKey.Length > 64)
                mapIconKey = mapIconKey[..64];
        }

        var isBookable = ResolveIsBookable(props, roomName);

        return new PolygonPublishCandidate(roomName, roomId, cx, cy, isBookable, mapIconKey);
    }

    private static string? ReadStringProp(JsonElement props, string name)
    {
        if (props.ValueKind != JsonValueKind.Object || !props.TryGetProperty(name, out var v))
            return null;
        return v.ValueKind switch
        {
            JsonValueKind.String => v.GetString(),
            JsonValueKind.Number => v.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => null
        };
    }

    private static bool ResolveIsBookable(JsonElement props, string roomName)
    {
        if (props.ValueKind == JsonValueKind.Object && props.TryGetProperty("isBookable", out var ib))
        {
            if (ib.ValueKind == JsonValueKind.False)
                return false;
            if (ib.ValueKind == JsonValueKind.True)
                return true;
        }

        return !InferNonBookableFromName(roomName);
    }

    private static readonly Regex NonBookableNamePattern = new(
        @"\b(wc|toilet|restrooms?|bathroom|lavatory|washroom|shower|cloakroom|kitchen|cafeteria|canteen|pantry|break[\s-]*room|coffee[\s-]*bar|corridor|hallway|circulation|lobby|foyer|landing|storage|closet|mechanical|electrical|utility|janitor|elevator|lift|stairwell|stairs|parking|garage|loading|lockers?)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(100));

    /// <summary>Heuristic: kitchens, restrooms, circulation, and similar spaces are not bookable by default.</summary>
    public static bool InferNonBookableFromName(string roomName) =>
        !string.IsNullOrWhiteSpace(roomName) && NonBookableNamePattern.IsMatch(roomName);

    private static bool ShouldSkipByName(string roomName)
    {
        var n = roomName.ToLowerInvariant();
        if (n.Contains("wall", StringComparison.Ordinal) || n.Contains("door", StringComparison.Ordinal) || n.Contains("window", StringComparison.Ordinal))
            return true;
        var t = roomName.Trim().ToLowerInvariant();
        return t is "building shell" or "exterior shell" or "building footprint"
               || t.Contains("building shell", StringComparison.Ordinal);
    }

    private static (double X, double Y) Centroid(IReadOnlyList<(double X, double Y)> ring)
    {
        var n = ring.Count;
        if (n > 1 && Math.Abs(ring[0].X - ring[n - 1].X) < 1e-9 && Math.Abs(ring[0].Y - ring[n - 1].Y) < 1e-9)
            n--;
        if (n <= 0) return (0.5, 0.5);
        double sx = 0, sy = 0;
        for (var i = 0; i < n; i++)
        {
            sx += ring[i].X;
            sy += ring[i].Y;
        }

        return (sx / n, sy / n);
    }

    private static double Clamp01(double v) => v < 0 ? 0 : v > 1 ? 1 : v;
}
