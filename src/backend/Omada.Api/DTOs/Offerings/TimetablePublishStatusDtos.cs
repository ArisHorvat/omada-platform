using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class TimetablePublishStatusRequest
{
    public DateTime? WeekStartDate { get; set; }

    public int? ClientUtcOffsetMinutes { get; set; }

    public Guid? ProgramGroupId { get; set; }

    public Guid? OfferingId { get; set; }

    public Guid? HostId { get; set; }

    public Guid? GroupId { get; set; }
}

public class TimetablePublishStatusResultDto
{
    [Required]
    public required IReadOnlyList<TimetableOfferingPublishStatusDto> Offerings { get; set; }

    public int TotalCount { get; set; }

    public int PublishedCount { get; set; }

    public int WithPatternCount { get; set; }

    public int WithConflictsCount { get; set; }

    public int ReadyToPublishCount { get; set; }

    public int ReadyToRepublishCount { get; set; }

    /// <summary>True when the request had view-scope filters (teacher/group/program). Conflict counts still use the full term.</summary>
    public bool ScopeFiltersApplied { get; set; }
}

public class TimetableOfferingPublishStatusDto
{
    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required string OfferingName { get; set; }

    public string? Code { get; set; }

    public bool HasPattern { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? PublishedAt { get; set; }

    /// <summary>Published offering whose weekly pattern differs from the last publish snapshot.</summary>
    public bool NeedsRepublish { get; set; }

    public int ConflictCount { get; set; }

    public IReadOnlyList<string>? ConflictMessages { get; set; }
}

public class BulkPublishTimetableRequest
{
    public Guid? ProgramGroupId { get; set; }

    public List<Guid>? OfferingIds { get; set; }

    public bool ReplaceExisting { get; set; }

    /// <summary>Skip offerings that still have scheduling conflicts.</summary>
    public bool SkipWithConflicts { get; set; } = true;

    /// <summary>Publish even when conflicts exist (same as per-offering force).</summary>
    public bool ForceDespiteConflicts { get; set; }

    public int? ClientUtcOffsetMinutes { get; set; }
}

public class BulkPublishTimetableResultDto
{
    public int PublishedCount { get; set; }

    public int SkippedConflictCount { get; set; }

    public int FailedCount { get; set; }

    [Required]
    public required IReadOnlyList<BulkPublishOfferingResultDto> Results { get; set; }
}

public class BulkPublishOfferingResultDto
{
    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required string OfferingName { get; set; }

    /// <summary>published | republished | skipped_conflict | failed | skipped_no_pattern</summary>
    [Required]
    public required string Outcome { get; set; }

    public string? Message { get; set; }

    public int? EventsCreated { get; set; }
}
