using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Schedule;

public class EventTypeDto
{
    [Required]
    public required Guid Id { get; set; }
    
    [Required]
    public required string Name { get; set; } = string.Empty;
    
    [Required]
    public required string Color { get; set; } = string.Empty;
}