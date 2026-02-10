namespace Omada.Api.DTOs.Schedule;

public class ScheduleItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Type { get; set; } // 0=Class, 1=Meeting, etc.
    public string Color { get; set; } = string.Empty;
}