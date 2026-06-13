namespace Omada.Api.DTOs.Groups;

public class UpdateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? ManagerId { get; set; }
    public Guid? ParentGroupId { get; set; }
    public string? ScheduleConfig { get; set; }

    public string? AcademicYear { get; set; }
}
