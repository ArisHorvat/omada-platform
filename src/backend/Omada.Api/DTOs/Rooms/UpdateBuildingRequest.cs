namespace Omada.Api.DTOs.Rooms;

public class UpdateBuildingRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ShortCode { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
