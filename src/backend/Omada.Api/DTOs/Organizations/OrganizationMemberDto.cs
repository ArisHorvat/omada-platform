using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class OrganizationMemberDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string FirstName { get; set; }

    [Required]
    public required string LastName { get; set; }

    [Required]
    public required string Email { get; set; }

    [Required]
    public required Guid RoleId { get; set; }

    [Required]
    public required string RoleName { get; set; }

    [Required]
    public required bool IsActive { get; set; }

    [Required]
    public required bool RequiresAdminApproval { get; set; }

    [Required]
    public required DateTime JoinedAt { get; set; }

    public string? AvatarUrl { get; set; }
}
