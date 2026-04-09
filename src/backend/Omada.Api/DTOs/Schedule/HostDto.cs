using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Schedule;

public class HostDto
{
    [Required]
    public required Guid Id { get; set; }
    
    [Required]
    public required string FullName { get; set; } = string.Empty;
    
    public string? AvatarUrl { get; set; }
}