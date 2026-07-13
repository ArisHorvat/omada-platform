namespace Omada.Api.DTOs.Offerings;

public class PublishTimetableRequest
{
    /// <summary>Soft-delete previously published timetable events for this offering before creating new ones.</summary>
    public bool ReplaceExisting { get; set; }

    /// <summary>Browser timezone offset in minutes (JavaScript <c>Date.getTimezoneOffset()</c>: UTC − local).</summary>
    public int? ClientUtcOffsetMinutes { get; set; }

    /// <summary>When true, publish even if preview detects host/cohort/room conflicts.</summary>
    public bool ForceDespiteConflicts { get; set; }
}

public class PublishTimetableResultDto
{
    public required int EventsCreated { get; set; }

    public required int ExpectedAttendanceRowsSeeded { get; set; }

    public required DateTime PublishedAt { get; set; }
}
