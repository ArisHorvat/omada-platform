namespace Omada.Api.Infrastructure.Options;

/// <summary>
/// Roboflow hosted inference for floorplan room segmentation (replaces the former Python ai-floorplan service).
/// </summary>
public sealed class RoboflowFloorplanOptions
{
    public const string SectionName = "Roboflow";

    /// <summary>Roboflow API key. When empty, floorplan AI extraction is unavailable.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Primary model id, e.g. <c>nirwana/1</c>.</summary>
    public string ModelId { get; set; } = "nirwana/1";

    /// <summary>Optional secondary model (doors/windows/walls). Used only when <see cref="ElementsModelEnabled"/> is true.</summary>
    public string? ElementsModelId { get; set; }

    /// <summary>Run the secondary elements model in addition to the primary rooms model.</summary>
    public bool ElementsModelEnabled { get; set; }

    /// <summary>When true, door/window/wall polygons are kept in GeoJSON (legacy behavior).</summary>
    public bool IncludeDoorWindowWallPolygons { get; set; }

    /// <summary>Roboflow detect API host (without trailing slash).</summary>
    public string ApiUrl { get; set; } = "https://detect.roboflow.com";

    /// <summary>Longest image side sent to inference (matches former Python guard).</summary>
    public int MaxImageSide { get; set; } = 2000;
}
