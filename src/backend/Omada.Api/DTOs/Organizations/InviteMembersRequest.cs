using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class InviteMemberItemDto
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    [Required]
    public required string RoleName { get; set; }
}

public class InviteMembersRequest
{
    [Required]
    public required List<InviteMemberItemDto> Members { get; set; }
}
