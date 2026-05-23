using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Organizations;

public class UpdateCurrentOrganizationRequest
{
    [Required]
    public required string Name { get; set; }

    public string? ShortName { get; set; }

    public string? EmailDomain { get; set; }

    [Required]
    public required string PrimaryColor { get; set; }

    [Required]
    public required string SecondaryColor { get; set; }

    [Required]
    public required string TertiaryColor { get; set; }

    public string? LogoUrl { get; set; }

    public int? OnboardingStep { get; set; }

    public OrganizationType? OrganizationType { get; set; }

    public bool? IsActive { get; set; }
}
