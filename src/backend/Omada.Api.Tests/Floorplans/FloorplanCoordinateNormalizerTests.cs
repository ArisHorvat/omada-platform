using Omada.Api.Infrastructure.Floorplans;

namespace Omada.Api.Tests.Floorplans;

/// <summary>
/// Thesis verification: floorplan coordinate normalization into [0,1]^2 with closed rings.
/// </summary>
public class FloorplanCoordinateNormalizerTests
{
    [Fact]
    public void PointsToNormalizedClosedRing_NormalizesAndClosesRing()
    {
        var ring = FloorplanCoordinateNormalizer.PointsToNormalizedClosedRing(
            [(0, 0), (100, 0), (100, 50)],
            imageWidth: 200,
            imageHeight: 100);

        Assert.NotNull(ring);
        Assert.True(FloorplanCoordinateNormalizer.IsWithinUnitSquare(ring!));
        Assert.True(FloorplanCoordinateNormalizer.IsClosedRing(ring!));
        Assert.Equal(0, ring![0][0]);
        Assert.Equal(0, ring[0][1]);
        Assert.Equal(0.5, ring[1][0]);
        Assert.Equal(0, ring[1][1]);
        Assert.Equal(0.5, ring[2][0]);
        Assert.Equal(0.5, ring[2][1]);
        Assert.Equal(ring[0][0], ring[^1][0]);
        Assert.Equal(ring[0][1], ring[^1][1]);
    }

    [Fact]
    public void PointsToNormalizedClosedRing_ReturnsNull_ForDegenerateInput()
    {
        Assert.Null(FloorplanCoordinateNormalizer.PointsToNormalizedClosedRing([(1, 1), (2, 2)], 100, 100));
        Assert.Null(FloorplanCoordinateNormalizer.PointsToNormalizedClosedRing([(0, 0), (1, 1), (2, 2)], 0, 100));
    }

    [Fact]
    public void BboxXywhToNormalizedRectRing_ProducesClosedUnitSquarePolygon()
    {
        var ring = FloorplanCoordinateNormalizer.BboxXywhToNormalizedRectRing(100, 50, 40, 20, 200, 100);

        Assert.NotNull(ring);
        Assert.Equal(5, ring!.Count);
        Assert.True(FloorplanCoordinateNormalizer.IsWithinUnitSquare(ring));
        Assert.True(FloorplanCoordinateNormalizer.IsClosedRing(ring));
    }
}
