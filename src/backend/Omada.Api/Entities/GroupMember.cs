// Omada.Api/Entities/GroupMember.cs
namespace Omada.Api.Entities;

public class GroupMember
{
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    
    // Could be "Student", "Teacher", "President", etc.
    public string? RoleInGroup { get; set; } 
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // EF Core Navigation Properties
    public virtual Group Group { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}