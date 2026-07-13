using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Offerings;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.DTOs.Scraping;

public class ApplyScrapedScheduleRequest
{
    [Required]
    public Guid PeriodId { get; set; }

    [Required]
    public Guid OfferingId { get; set; }

    /// <summary>Scoped scraped rows from import preview (already filtered by program page + study group).</summary>
    [Required]
    public required IReadOnlyList<ScrapedEventDto> Events { get; set; }

    /// <summary>Study group label from scope (e.g. 934/1) — used to resolve cohort group ids.</summary>
    public string? StudyGroupLabel { get; set; }

    /// <summary>When true, replace weekly pattern; when false, append new activities.</summary>
    public bool ReplaceExistingSessions { get; set; }

    /// <summary>When true, every scoped row applies to <see cref="OfferingId"/> (single-course / group timetable pages).</summary>
    public bool ImportAllScopedRows { get; set; }

    /// <summary>Course name from page title when rows lack a subject column.</summary>
    public string? ImplicitCourseName { get; set; }

    public ScrapedImportMappingsDto? Mappings { get; set; }
}

public class ApplyScrapedSchedulePreviewResultDto
{
    public required IReadOnlyList<OfferingWeeklySessionDto> ProposedSessions { get; set; }

    public required IReadOnlyList<ScrapedScheduleApplySkipDto> Skipped { get; set; }

    public int MatchedEventCount { get; init; }

    public int ExistingSessionCount { get; init; }

    public int ResultSessionCount { get; init; }
}

public class ApplyScrapedScheduleResultDto : ApplyScrapedSchedulePreviewResultDto
{
    public bool Applied { get; init; }

    public Guid OfferingId { get; init; }
}

public class ScrapedScheduleApplySkipDto
{
    public required string ClassName { get; init; }

    public required string Time { get; init; }

    public required string Reason { get; init; }
}
