namespace Omada.Api.DTOs.Offerings;

public class PublishTimetableRequest
{
    /// <summary>Soft-delete previously published timetable events for this offering before creating new ones.</summary>
    public bool ReplaceExisting { get; set; }
}

public class PublishTimetableResultDto
{
    public required int EventsCreated { get; set; }

    public required int ExpectedAttendanceRowsSeeded { get; set; }

    public required DateTime PublishedAt { get; set; }
}
