using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Omada.Api.Infrastructure.Options;
using Omada.Api.Services.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace Omada.Api.Services.FloorplanAi;

/// <summary>
/// Floorplan pipeline: decode/resize image → Roboflow segmentation → GeoJSON FeatureCollection.
/// Ported from the former Python <c>ai-floorplan</c> service (<c>app/processing.py</c>).
/// </summary>
public sealed class RoboflowFloorplanGeoJsonExtractor : IFloorplanGeoJsonExtractor
{
    public const string HttpClientName = "RoboflowFloorplan";

    private static readonly Regex TokenRegex = new(@"[a-z0-9]+", RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly HashSet<string> DoorWindowWallTokens = new(StringComparer.Ordinal)
    {
        "door", "doors", "doorframe", "doorway", "window", "windows", "wall", "walls"
    };

    private readonly RoboflowFloorplanOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<RoboflowFloorplanGeoJsonExtractor> _logger;

    public RoboflowFloorplanGeoJsonExtractor(
        IOptions<RoboflowFloorplanOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<RoboflowFloorplanGeoJsonExtractor> logger)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.ApiKey);

    public async Task<string> ExtractGeoJsonAsync(byte[] imageBytes, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Roboflow floorplan extraction skipped: Roboflow:ApiKey is not set.");
            return EmptyFeatureCollectionJson;
        }

        var jpegBytes = PrepareImageForInference(imageBytes, _options.MaxImageSide);
        if (jpegBytes == null || jpegBytes.Length == 0)
            throw new InvalidOperationException("Could not decode floorplan image bytes.");

        var features = await GetAllFeaturesFromRoboflowAsync(jpegBytes, cancellationToken);

        if (!_options.IncludeDoorWindowWallPolygons && features.Count > 0)
        {
            var before = features.Count;
            features = features
                .Where(f => !LooksLikeWallDoorWindowPolygonClass(f.ClassName))
                .ToList();
            if (before > features.Count)
            {
                _logger.LogDebug("Filtered {Count} door/window/wall polygon(s) before GeoJSON.", before - features.Count);
            }
        }

        return FeaturesToFeatureCollectionJson(features);
    }

    private const string EmptyFeatureCollectionJson = """{"type":"FeatureCollection","features":[]}""";

    private async Task<List<FloorplanFeatureResult>> GetAllFeaturesFromRoboflowAsync(
        byte[] jpegBytes,
        CancellationToken cancellationToken)
    {
        var models = new List<string>();
        var primary = (_options.ModelId ?? "").Trim();
        if (!string.IsNullOrEmpty(primary))
            models.Add(primary);

        var elementsId = (_options.ElementsModelId ?? "").Trim();
        if (_options.ElementsModelEnabled && !string.IsNullOrEmpty(elementsId))
            models.Add(elementsId);

        if (models.Count == 0)
        {
            _logger.LogWarning("No Roboflow model ids configured (Roboflow:ModelId empty?).");
            return [];
        }

        using var image = Image.Load<Rgb24>(jpegBytes);
        var imgW = image.Width;
        var imgH = image.Height;

        var all = new List<FloorplanFeatureResult>();
        var client = _httpClientFactory.CreateClient(HttpClientName);

        foreach (var modelId in models)
        {
            JsonDocument? doc;
            try
            {
                doc = await InferRoboflowAsync(client, jpegBytes, modelId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Roboflow infer failed for model {ModelId}", modelId);
                continue;
            }

            using (doc)
            {
                if (doc == null)
                    continue;

                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                    root = root[0];

                if (!root.TryGetProperty("predictions", out var predictions) || predictions.ValueKind != JsonValueKind.Array)
                    continue;

                foreach (var pred in predictions.EnumerateArray())
                {
                    if (pred.ValueKind != JsonValueKind.Object)
                        continue;
                    var feat = PredictionToFeature(pred, imgW, imgH);
                    if (feat != null)
                        all.Add(feat);
                }
            }
        }

        return all;
    }

    private async Task<JsonDocument?> InferRoboflowAsync(
        HttpClient client,
        byte[] jpegBytes,
        string modelId,
        CancellationToken cancellationToken)
    {
        var baseUrl = (_options.ApiUrl ?? "https://detect.roboflow.com").TrimEnd('/');
        var url = $"{baseUrl}/{modelId.Trim()}?api_key={Uri.EscapeDataString(_options.ApiKey!)}";

        using var content = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(jpegBytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(imageContent, "file", "floorplan.jpg");

        using var response = await client.PostAsync(url, content, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Roboflow returned {(int)response.StatusCode} for model {modelId}: {body}");
        }

        if (string.IsNullOrWhiteSpace(body))
            return null;

        return JsonDocument.Parse(body);
    }

    private static byte[]? PrepareImageForInference(byte[] imageBytes, int maxSide)
    {
        if (imageBytes.Length == 0)
            return null;

        using var image = Image.Load<Rgba32>(imageBytes);
        using var rgb = FlattenOntoWhite(image);
        rgb.Mutate(ctx =>
        {
            var m = Math.Max(rgb.Width, rgb.Height);
            if (m > maxSide && maxSide > 0)
            {
                var scale = maxSide / (double)m;
                var newW = Math.Max(1, (int)Math.Round(rgb.Width * scale));
                var newH = Math.Max(1, (int)Math.Round(rgb.Height * scale));
                ctx.Resize(newW, newH);
            }
        });

        using var ms = new MemoryStream();
        rgb.SaveAsJpeg(ms, new JpegEncoder { Quality = 90 });
        return ms.ToArray();
    }

    private static Image<Rgb24> FlattenOntoWhite(Image<Rgba32> source)
    {
        var canvas = new Image<Rgb24>(source.Width, source.Height);
        canvas.Mutate(c =>
        {
            c.BackgroundColor(Color.White);
            c.DrawImage(source, new Point(0, 0), 1f);
        });
        return canvas;
    }

    private sealed record FloorplanFeatureResult(
        List<List<double>> Ring,
        double Confidence,
        string ClassName);

    private static FloorplanFeatureResult? PredictionToFeature(JsonElement pred, int imgW, int imgH)
    {
        if (pred.TryGetProperty("points", out var ptsRaw) && ptsRaw.ValueKind == JsonValueKind.Array && ptsRaw.GetArrayLength() > 0)
        {
            var pts = ParsePointsArray(ptsRaw);
            var ring = PointsToNormalizedClosedRing(pts, imgW, imgH);
            if (ring == null)
                return null;
            return new FloorplanFeatureResult(ring, ConfidenceFromPrediction(pred), ClassNameFromPrediction(pred));
        }

        if (pred.TryGetProperty("x", out _) && pred.TryGetProperty("y", out _)
            && pred.TryGetProperty("width", out _) && pred.TryGetProperty("height", out _))
        {
            var ring = BboxXywhToNormalizedRectRing(pred, imgW, imgH);
            if (ring == null)
                return null;
            return new FloorplanFeatureResult(ring, ConfidenceFromPrediction(pred), ClassNameFromPrediction(pred));
        }

        return null;
    }

    private static List<Dictionary<string, double>> ParsePointsArray(JsonElement raw)
    {
        var outPts = new List<Dictionary<string, double>>();
        foreach (var p in raw.EnumerateArray())
        {
            if (p.ValueKind == JsonValueKind.Object && p.TryGetProperty("x", out var xEl) && p.TryGetProperty("y", out var yEl))
            {
                if (TryToDouble(xEl, out var x) && TryToDouble(yEl, out var y))
                    outPts.Add(new Dictionary<string, double> { ["x"] = x, ["y"] = y });
            }
            else if (p.ValueKind == JsonValueKind.Array && p.GetArrayLength() >= 2)
            {
                if (TryToDouble(p[0], out var x) && TryToDouble(p[1], out var y))
                    outPts.Add(new Dictionary<string, double> { ["x"] = x, ["y"] = y });
            }
        }

        return outPts;
    }

    private static bool TryToDouble(JsonElement el, out double value)
    {
        if (el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out value))
            return true;
        value = 0;
        return false;
    }

    private static List<List<double>>? PointsToNormalizedClosedRing(
        List<Dictionary<string, double>> points,
        int imgW,
        int imgH)
    {
        if (imgW <= 0 || imgH <= 0 || points.Count < 3)
            return null;

        var ring = new List<List<double>>();
        foreach (var pt in points)
        {
            if (!pt.TryGetValue("x", out var px) || !pt.TryGetValue("y", out var py))
                continue;
            ring.Add([px / imgW, py / imgH]);
        }

        if (ring.Count < 3)
            return null;

        var ax = ring[0][0];
        var ay = ring[0][1];
        var bx = ring[^1][0];
        var by = ring[^1][1];
        if (Math.Abs(ax - bx) > 1e-9 || Math.Abs(ay - by) > 1e-9)
            ring.Add([ax, ay]);

        return ring;
    }

    private static List<List<double>>? BboxXywhToNormalizedRectRing(JsonElement pred, int imgW, int imgH)
    {
        if (!TryToDouble(pred.GetProperty("x"), out var cx)
            || !TryToDouble(pred.GetProperty("y"), out var cy)
            || !TryToDouble(pred.GetProperty("width"), out var bw)
            || !TryToDouble(pred.GetProperty("height"), out var bh))
            return null;

        if (bw <= 0 || bh <= 0)
            return null;

        var (pcx, pcy, pbw, pbh) = PixelXywhIfNormalized(cx, cy, bw, bh, imgW, imgH);
        var halfW = pbw / 2.0;
        var halfH = pbh / 2.0;
        var x1 = pcx - halfW;
        var y1 = pcy - halfH;
        var x2 = pcx + halfW;
        var y2 = pcy + halfH;

        double Nxp(double px) => px / imgW;
        double Nyp(double py) => py / imgH;

        return
        [
            [Nxp(x1), Nyp(y1)],
            [Nxp(x2), Nyp(y1)],
            [Nxp(x2), Nyp(y2)],
            [Nxp(x1), Nyp(y2)],
            [Nxp(x1), Nyp(y1)]
        ];
    }

    private static (double cx, double cy, double bw, double bh) PixelXywhIfNormalized(
        double cx, double cy, double bw, double bh, int imgW, int imgH)
    {
        var maxDim = Math.Max(Math.Max(Math.Abs(cx), Math.Abs(cy)), Math.Max(Math.Abs(bw), Math.Abs(bh)));
        if (maxDim <= 1.0 + 1e-9 && imgW > 1 && imgH > 1)
            return (cx * imgW, cy * imgH, bw * imgW, bh * imgH);
        return (cx, cy, bw, bh);
    }

    private static double ConfidenceFromPrediction(JsonElement pred)
    {
        foreach (var key in new[] { "confidence", "score", "class_confidence", "prediction_score" })
        {
            if (!pred.TryGetProperty(key, out var v))
                continue;
            if (v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var d))
                return Math.Clamp(d, 0, 1);
        }

        return 0;
    }

    private static string ClassNameFromPrediction(JsonElement pred)
    {
        foreach (var key in new[] { "class", "class_name", "label", "name" })
        {
            if (!pred.TryGetProperty(key, out var v))
                continue;
            var s = v.GetString()?.Trim();
            if (!string.IsNullOrEmpty(s))
                return s;
        }

        return "feature";
    }

    private static bool LooksLikeWallDoorWindowPolygonClass(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        var s = Regex.Replace(raw, @"([a-z])([A-Z])", "$1 $2").ToLowerInvariant()
            .Replace('_', ' ')
            .Replace('-', ' ');
        var tokens = TokenRegex.Matches(s).Select(m => m.Value).ToHashSet(StringComparer.Ordinal);
        return tokens.Overlaps(DoorWindowWallTokens);
    }

    private static string FeaturesToFeatureCollectionJson(List<FloorplanFeatureResult> features)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteString("type", "FeatureCollection");
            writer.WriteStartArray("features");

            foreach (var item in features)
            {
                if (item.Ring.Count < 3)
                    continue;

                var roomName = string.IsNullOrWhiteSpace(item.ClassName) ? "feature" : item.ClassName.Trim();
                var rid = Guid.NewGuid().ToString();
                var conf = Math.Round(Math.Clamp(item.Confidence, 0, 1), 4, MidpointRounding.AwayFromZero);

                writer.WriteStartObject();
                writer.WriteString("type", "Feature");
                writer.WriteString("id", $"floorplan-{rid}");
                writer.WriteStartObject("properties");
                writer.WriteString("roomName", roomName);
                writer.WriteString("roomId", rid);
                writer.WriteNumber("confidence", conf);
                writer.WriteEndObject();
                writer.WriteStartObject("geometry");
                writer.WriteString("type", "Polygon");
                writer.WriteStartArray("coordinates");
                writer.WriteStartArray();
                foreach (var p in item.Ring)
                {
                    writer.WriteStartArray();
                    writer.WriteNumberValue(p[0]);
                    writer.WriteNumberValue(p[1]);
                    writer.WriteEndArray();
                }

                writer.WriteEndArray();
                writer.WriteEndArray();
                writer.WriteEndObject();
                writer.WriteEndObject();
            }

            writer.WriteEndArray();
            writer.WriteEndObject();
        }

        return Encoding.UTF8.GetString(stream.ToArray());
    }
}
