using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

public class GroupTypeOptionDto
{
    [Required]
    public required string Key { get; set; }

    [Required]
    public required string Label { get; set; }

    [Required]
    public required string Description { get; set; }

    public string? SuggestedParentType { get; set; }
}
