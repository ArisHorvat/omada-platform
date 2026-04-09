using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

public class AttendanceConfigDto
{
    // Make Mode required so TypeScript knows it's always a string
    [Required]
    public required string Mode { get; set; } 
    
    // Make the list required (even if it's an empty list, it's never undefined)
    [Required]
    public required List<GroupDto> Groups { get; set; } 
    
    // Because this is marked with '?', TypeScript will correctly type it as 'Group | null'
    public GroupDto? Department { get; set; }
}