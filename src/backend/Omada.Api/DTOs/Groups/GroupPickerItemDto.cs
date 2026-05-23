using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

/// <summary>Lightweight group row for schedule, assignment, and grade pickers.</summary>
public class GroupPickerItemDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required string Type { get; set; }

    [Required]
    public required string TypeLabel { get; set; }
}
