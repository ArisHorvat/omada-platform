using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Organizations;

public class OrganizationDetailsDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public OrganizationType OrganizationType { get; set; }
    
    [Required]
    public required string Name { get; set; }
    
    [Required]
    public required string ShortName { get; set; }
    
    [Required]
    public required string EmailDomain { get; set; }
    
    [Required]
    public required string PrimaryColor { get; set; }
    
    [Required]
    public required string SecondaryColor { get; set; }
    
    [Required]
    public required string TertiaryColor { get; set; }
    
    // Collections
    [Required]
    public required IEnumerable<string> Roles { get; set; }
    
    [Required]
    public required IEnumerable<string> Widgets { get; set; }
    
    [Required]
    public required Dictionary<string, List<string>> RoleWidgetMappings { get; set; }

    // Optional
    public string? LogoUrl { get; set; }
}