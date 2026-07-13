namespace Omada.Api.Infrastructure.Floorplans;

/// <summary>
/// Converts pixel-space polygon vertices to normalized [0,1] rings closed for GeoJSON (RFC 7946).
/// </summary>
public static class FloorplanCoordinateNormalizer
{
    public static List<List<double>>? PointsToNormalizedClosedRing(
        IReadOnlyList<(double X, double Y)> points,
        int imageWidth,
        int imageHeight)
    {
        if (imageWidth <= 0 || imageHeight <= 0 || points.Count < 3)
            return null;

        var ring = new List<List<double>>();
        foreach (var (px, py) in points)
            ring.Add([px / imageWidth, py / imageHeight]);

        if (ring.Count < 3)
            return null;

        CloseRing(ring);
        return ring;
    }

    public static List<List<double>>? BboxXywhToNormalizedRectRing(
        double centerX,
        double centerY,
        double boxWidth,
        double boxHeight,
        int imageWidth,
        int imageHeight)
    {
        if (boxWidth <= 0 || boxHeight <= 0 || imageWidth <= 0 || imageHeight <= 0)
            return null;

        var (pcx, pcy, pbw, pbh) = PixelXywhIfNormalized(centerX, centerY, boxWidth, boxHeight, imageWidth, imageHeight);
        var halfW = pbw / 2.0;
        var halfH = pbh / 2.0;
        var x1 = pcx - halfW;
        var y1 = pcy - halfH;
        var x2 = pcx + halfW;
        var y2 = pcy + halfH;

        double Nxp(double px) => px / imageWidth;
        double Nyp(double py) => py / imageHeight;

        return
        [
            [Nxp(x1), Nyp(y1)],
            [Nxp(x2), Nyp(y1)],
            [Nxp(x2), Nyp(y2)],
            [Nxp(x1), Nyp(y2)],
            [Nxp(x1), Nyp(y1)]
        ];
    }

    public static bool IsWithinUnitSquare(IReadOnlyList<IReadOnlyList<double>> ring)
    {
        foreach (var point in ring)
        {
            if (point.Count < 2)
                return false;
            if (point[0] < 0 || point[0] > 1 || point[1] < 0 || point[1] > 1)
                return false;
        }

        return true;
    }

    public static bool IsClosedRing(IReadOnlyList<IReadOnlyList<double>> ring)
    {
        if (ring.Count < 4)
            return false;

        var first = ring[0];
        var last = ring[^1];
        return Math.Abs(first[0] - last[0]) <= 1e-9 && Math.Abs(first[1] - last[1]) <= 1e-9;
    }

    private static void CloseRing(List<List<double>> ring)
    {
        var ax = ring[0][0];
        var ay = ring[0][1];
        var bx = ring[^1][0];
        var by = ring[^1][1];
        if (Math.Abs(ax - bx) > 1e-9 || Math.Abs(ay - by) > 1e-9)
            ring.Add([ax, ay]);
    }

    private static (double cx, double cy, double bw, double bh) PixelXywhIfNormalized(
        double cx, double cy, double bw, double bh, int imgW, int imgH)
    {
        var maxDim = Math.Max(Math.Max(Math.Abs(cx), Math.Abs(cy)), Math.Max(Math.Abs(bw), Math.Abs(bh)));
        if (maxDim <= 1.0 + 1e-9 && imgW > 1 && imgH > 1)
            return (cx * imgW, cy * imgH, bw * imgW, bh * imgH);
        return (cx, cy, bw, bh);
    }
}
