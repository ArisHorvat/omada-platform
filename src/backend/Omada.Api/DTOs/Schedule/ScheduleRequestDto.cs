namespace Omada.Api.DTOs.Schedule;

public class ScheduleRequestDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public Guid? TargetId { get; set; }
    public int TargetType { get; set; } // 0=User, 1=Group, 2=Room
}