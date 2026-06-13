namespace Omada.Api.DTOs.Groups;

public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "class";
    public Guid? ManagerId { get; set; }
    public Guid? ParentGroupId { get; set; }
    public string? ScheduleConfig { get; set; }

    /// <summary>Academic year for stable cohort groups (e.g. 2025/26).</summary>
    public string? AcademicYear { get; set; }
}