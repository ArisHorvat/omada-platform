namespace Omada.Api.DTOs.Groups;

public class CreateGroupRequest
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "class";
    public Guid? ManagerId { get; set; }
    public Guid? ParentGroupId { get; set; }
    public string? ScheduleConfig { get; set; }
}