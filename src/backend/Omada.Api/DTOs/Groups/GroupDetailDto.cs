using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Groups;

public class GroupDetailDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required string Type { get; set; }

    public Guid? ParentGroupId { get; set; }
    public string? ParentName { get; set; }
    public Guid? ManagerId { get; set; }
    public string? ManagerName { get; set; }
    public string? ScheduleConfig { get; set; }

    /// <summary>Members in this group only (not sub-groups).</summary>
    [Required]
    public int DirectMemberCount { get; set; }

    /// <summary>Distinct members in this group and all nested sub-groups.</summary>
    [Required]
    public required int MemberCount { get; set; }

    [Required]
    public required int ChildCount { get; set; }

    [Required]
    public required IReadOnlyList<GroupSummaryDto> Children { get; set; }
}

public class GroupSummaryDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required string Type { get; set; }

    [Required]
    public required int MemberCount { get; set; }
}
