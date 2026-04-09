using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Auth;

public class UserOrganizationDto
{
    [Required]
    public required Guid OrganizationId { get; set; }

    [Required]
    public OrganizationType OrganizationType { get; set; }
    
    [Required]
    public required string OrganizationName { get; set; }
    
    [Required]
    public required string Role { get; set; }
    
    [Required]
    public required bool IsCurrent { get; set; }
    
    // Optional
    public string? LogoUrl { get; set; }
}