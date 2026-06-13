using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Auth;

public class PendingOrganizationInviteDto
{
    [Required]
    public required Guid OrganizationId { get; set; }

    [Required]
    public required string OrganizationName { get; set; }

    public string? LogoUrl { get; set; }

    [Required]
    public required string InviteCode { get; set; }

    [Required]
    public required string RoleName { get; set; }

    public DateTime InvitedAt { get; set; }
}
