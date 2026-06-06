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

    public bool HasExistingAccount { get; set; }
    public bool HasPendingInvite { get; set; }
    public bool IsAlreadyMember { get; set; }
    public bool RequiresSignIn { get; set; }
    public bool RequiresRegistration { get; set; }
    public string? InvitedFirstName { get; set; }
    public string? InvitedLastName { get; set; }
    public string? InvitedEmail { get; set; }
    public bool InviteLinkExpired { get; set; }
}
