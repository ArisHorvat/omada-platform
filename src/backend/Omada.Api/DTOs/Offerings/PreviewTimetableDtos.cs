using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class PreviewTimetableRequest
{
    /// <summary>Monday (or first day) of the week to preview, calendar date in the admin's timezone.</summary>
    [Required]
    public DateTime WeekStartDate { get; set; }

    /// <summary>JavaScript <c>Date.getTimezoneOffset()</c> — UTC − local.</summary>
    public int? ClientUtcOffsetMinutes { get; set; }

    public Guid? ProgramGroupId { get; set; }

    public Guid? OfferingId { get; set; }

    public Guid? HostId { get; set; }

    /// <summary>Group / series / subgroup / cohort — includes descendant groups.</summary>
    public Guid? GroupId { get; set; }
}

public class PreviewTimetableResultDto
{
    [Required]
    public required DateTime WeekStartDate { get; set; }

    [Required]
    public required DateTime WeekEndDate { get; set; }

    [Required]
    public required IReadOnlyList<TimetablePreviewSlotDto> Slots { get; set; }

    [Required]
    public required IReadOnlyList<TimetablePreviewConflictDto> Conflicts { get; set; }

    public int ConflictCount { get; set; }
}

public class TimetablePreviewSlotDto
{
    [Required]
    public required string Key { get; set; }

    /// <summary><c>published</c> from schedule events, <c>proposed</c> from weekly patterns.</summary>
    [Required]
    public required string Source { get; set; }

    [Required]
    public required DateTime StartTime { get; set; }

    [Required]
    public required DateTime EndTime { get; set; }

    [Required]
    public required string Title { get; set; }

    public Guid? OfferingId { get; set; }

    public string? OfferingName { get; set; }

    public Guid? HostId { get; set; }

    public string? HostName { get; set; }

    public Guid? CohortGroupId { get; set; }

    public string? CohortGroupName { get; set; }

    /// <summary>All cohort/subgroup labels when split delivery or combined audience.</summary>
    public IReadOnlyList<string>? CohortGroupNames { get; set; }

    public string? ActivityLabel { get; set; }

    public Guid? EventTypeId { get; set; }

    public string? EventTypeName { get; set; }

    /// <summary>From event type catalog (or event override when published).</summary>
    public string? EventTypeColorHex { get; set; }

    public string? ProgramGroupName { get; set; }

    /// <summary><c>all</c> = entire offering enrollment; <c>selected</c> = specific cohorts.</summary>
    public string? AudienceScope { get; set; }

    public Guid? RoomId { get; set; }

    public string? RoomName { get; set; }

    public bool HasConflict { get; set; }
}

public class TimetablePreviewConflictDto
{
    /// <summary><c>host</c>, <c>cohort</c>, or <c>room</c>.</summary>
    [Required]
    public required string ConflictType { get; set; }

    [Required]
    public required string SlotKeyA { get; set; }

    [Required]
    public required string SlotKeyB { get; set; }

    [Required]
    public required string Message { get; set; }
}
