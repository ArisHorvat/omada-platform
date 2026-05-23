namespace Omada.Api.DTOs.Groups;

public class AddGroupMembersRequest
{
    public List<Guid> UserIds { get; set; } = [];
    public string? RoleInGroup { get; set; }
}
