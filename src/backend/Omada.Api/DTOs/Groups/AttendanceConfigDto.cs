using Omada.Api.Entities;

namespace Omada.Api.DTOs.Groups;

public class AttendanceConfigDto
{
    public string Mode { get; set; } = "Student"; // "UniversalSessionManager", "SessionManager", "Approval", "Student"
    public List<Group> Groups { get; set; } = new();
    public Group? Department { get; set; }
}