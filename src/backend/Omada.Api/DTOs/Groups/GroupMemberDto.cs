using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

public class GroupMemberDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string FirstName { get; set; }

    [Required]
    public required string LastName { get; set; }

    public string? Email { get; set; }
    public string? RoleInGroup { get; set; }
    public string? AvatarUrl { get; set; }

    [Required]
    public required string RoleName { get; set; }
}
