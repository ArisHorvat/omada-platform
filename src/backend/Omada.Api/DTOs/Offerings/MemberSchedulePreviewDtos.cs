using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class MemberSchedulePreviewRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public DateTime WeekStartDate { get; set; }

    public int? ClientUtcOffsetMinutes { get; set; }
}

public class MemberSchedulePreviewResultDto
{
    public required DateTime WeekStartDate { get; set; }

    public required DateTime WeekEndDate { get; set; }

    public required Guid UserId { get; set; }

    public string? UserDisplayName { get; set; }

    public required int SessionCount { get; set; }

    public required IReadOnlyList<MemberSchedulePreviewItemDto> Sessions { get; set; }
}

public class MemberSchedulePreviewItemDto
{
    public required Guid EventId { get; set; }

    public required string Title { get; set; }

    public required DateTime StartTime { get; set; }

    public required DateTime EndTime { get; set; }

    public string? TypeName { get; set; }

    public string? HostName { get; set; }

    public string? RoomName { get; set; }

    public string? OfferingName { get; set; }

    public string? CohortGroupName { get; set; }

    public string VisibilityReason { get; set; } = "schedule";
}
