namespace Omada.Api.DTOs.Schedule;

public class ProposeMeetingTimeRequest
{
    public DateTime ProposedStart { get; set; }
    public DateTime ProposedEnd { get; set; }
    public string? Message { get; set; }
}
