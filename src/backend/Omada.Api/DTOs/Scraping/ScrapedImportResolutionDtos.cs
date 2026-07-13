using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Offerings;

namespace Omada.Api.DTOs.Scraping;

public class ScrapedImportResolutionRequest
{
    [Required]
    public Guid PeriodId { get; set; }

    [Required]
    public required IReadOnlyList<ScrapedEventDto> Events { get; set; }

    public string? StudyGroupLabel { get; set; }

    public Guid? SelectedOfferingId { get; set; }
}

public class ScrapedImportResolutionResultDto
{
    public required string ScopeSummary { get; init; }

    /// <summary>True when rows look like a single-course page (no subject column).</summary>
    public bool RecommendSingleOfferingImport { get; init; }

    public Guid? SuggestedOfferingId { get; init; }

    public string? SuggestedOfferingName { get; init; }

    public string? ImplicitCourseName { get; init; }

    public required IReadOnlyList<ScrapedImportFieldResolutionDto> Subjects { get; init; }

    public required IReadOnlyList<ScrapedImportFieldResolutionDto> ActivityTypes { get; init; }

    public required IReadOnlyList<ScrapedImportFieldResolutionDto> Professors { get; init; }

    public required IReadOnlyList<ScrapedImportFieldResolutionDto> Rooms { get; init; }

    public required IReadOnlyList<ScrapedImportGroupResolutionDto> StudyGroups { get; init; }

    public required IReadOnlyList<ScrapedImportFieldResolutionDto> EventTypes { get; init; }
}

public class ScrapedImportFieldResolutionDto
{
    public required string ScrapedLabel { get; init; }

    public int EventCount { get; init; }

    public Guid? SuggestedTargetId { get; init; }

    public string? SuggestedTargetLabel { get; init; }

    public float Confidence { get; init; }

    public required IReadOnlyList<ScrapedImportSuggestionDto> Suggestions { get; init; }
}

public class ScrapedImportGroupResolutionDto
{
    public required string ScrapedLabel { get; init; }

    public int EventCount { get; init; }

    /// <summary>program | series | group | subgroup</summary>
    public string? SuggestedGroupType { get; init; }

    public Guid? SuggestedGroupId { get; init; }

    public string? SuggestedGroupLabel { get; init; }

    public required IReadOnlyList<ScrapedImportSuggestionDto> Suggestions { get; init; }
}

public class ScrapedImportSuggestionDto
{
    public Guid? Id { get; init; }

    public required string Label { get; init; }

    public string? Subtitle { get; init; }

    public float Score { get; init; }
}

public class ScrapedImportMappingsDto
{
    /// <summary>Scraped subject label → course offering id (multi-course imports).</summary>
    public Dictionary<string, Guid?> SubjectToOfferingId { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Scraped activity label (Curs, Laborator) → event type id.</summary>
    public Dictionary<string, Guid?> ActivityTypeToEventTypeId { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, Guid?> ProfessorToHostId { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, Guid?> RoomToRoomId { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Scraped study group label → Omada group id (series / group / subgroup).</summary>
    public Dictionary<string, Guid?> StudyGroupToGroupId { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>When no host id — override display name on weekly pattern (pending invite / name-only).</summary>
    public Dictionary<string, string?> ProfessorToDisplayName { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
