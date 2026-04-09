using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

public class GroupDto
{
    [Required]
    public required Guid Id { get; set; }
    
    [Required]
    public required string Name { get; set; }
    
    [Required]
    public required string Type { get; set; }
    
    public Guid? ParentGroupId { get; set; }
}