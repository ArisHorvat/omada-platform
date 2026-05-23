using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class OrganizationInvitePreviewDto
{
    [Required]
    public required Guid OrganizationId { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? LogoUrl { get; set; }

    [Required]
    public required string InviteCode { get; set; }
}
