using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Rooms;

public class BuildingDto
{
    [Required]
    public required Guid Id { get; set; }
    
    [Required]
    public required string Name { get; set; }
    
    public string? ShortCode { get; set; }

    public string? Address { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}