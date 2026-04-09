namespace Omada.Api.Entities;

public class Group : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }
    public Guid? ParentGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? ManagerId { get; set; }
    
    // Can be mapped to a JSON column or owned entity later
    public string? ScheduleConfig { get; set; } 

    // Navigation Properties
    public virtual Organization Organization { get; set; } = null!;
    public virtual Group? ParentGroup { get; set; }
    public virtual ICollection<Group> SubGroups { get; set; } = new List<Group>();
    public virtual User? Manager { get; set; }
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
}