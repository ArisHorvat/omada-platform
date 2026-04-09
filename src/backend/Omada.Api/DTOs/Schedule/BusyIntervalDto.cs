namespace Omada.Api.DTOs.Schedule;

/// <summary>Free/busy overlay: time range only (no meeting titles).</summary>
public class BusyIntervalDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
