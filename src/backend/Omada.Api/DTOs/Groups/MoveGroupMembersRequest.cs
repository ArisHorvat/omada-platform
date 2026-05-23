namespace Omada.Api.DTOs.Groups;

public class MoveGroupMembersRequest
{
    public Guid SourceGroupId { get; set; }
    public Guid TargetGroupId { get; set; }
    public List<Guid> UserIds { get; set; } = [];
    public string? RoleInGroup { get; set; }
}
