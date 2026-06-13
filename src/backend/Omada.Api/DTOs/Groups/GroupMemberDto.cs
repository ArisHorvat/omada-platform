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

    /// <summary>True when membership is on the group being viewed; false when shown via rollup from a sub-group.</summary>
    [Required]
    public bool IsDirectMember { get; set; }

    /// <summary>Group where this user is actually placed (may be a child group).</summary>
    [Required]
    public Guid PlacementGroupId { get; set; }

    [Required]
    public required string PlacementGroupName { get; set; }
}
