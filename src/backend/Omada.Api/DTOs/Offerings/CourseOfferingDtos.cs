using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class CourseOfferingDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid OrganizationId { get; set; }

    [Required]
    public required Guid PeriodId { get; set; }

    public Guid? ProgramGroupId { get; set; }

    public string? ProgramGroupName { get; set; }

    public Guid? SubjectCatalogGroupId { get; set; }

    public string? SubjectCatalogGroupName { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? Code { get; set; }

    public string? Description { get; set; }

    public Guid? HostId { get; set; }

    public string? HostName { get; set; }

    [Required]
    public required IReadOnlyList<Guid> ProgramGroupIds { get; set; }

    [Required]
    public required IReadOnlyList<string> ProgramGroupNames { get; set; }

    [Required]
    public required IReadOnlyList<OfferingInstructorDto> Instructors { get; set; }

    [Required]
    public required int EnrollmentCount { get; set; }

    [Required]
    public required decimal Credits { get; set; }

    public decimal? RequiredAttendancePercent { get; set; }

    public DateTime? TimetablePublishedAt { get; set; }

    [Required]
    public required IReadOnlyList<OfferingWeeklySessionDto> WeeklySessions { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }
}

public class CreateCourseOfferingRequest
{
    [Required]
    public required string Name { get; set; }

    public string? Code { get; set; }

    public string? Description { get; set; }

    public Guid? ProgramGroupId { get; set; }

    public Guid? SubjectCatalogGroupId { get; set; }

    public Guid? HostId { get; set; }

    public List<Guid>? ProgramGroupIds { get; set; }

    public List<OfferingInstructorInputDto>? Instructors { get; set; }

    public List<OfferingWeeklySessionDto>? WeeklySessions { get; set; }

    public decimal Credits { get; set; }

    public decimal? RequiredAttendancePercent { get; set; }
}

public class UpdateCourseOfferingRequest
{
    [Required]
    public required string Name { get; set; }

    public string? Code { get; set; }

    public string? Description { get; set; }

    public Guid? ProgramGroupId { get; set; }

    public Guid? SubjectCatalogGroupId { get; set; }

    public Guid? HostId { get; set; }

    public List<Guid>? ProgramGroupIds { get; set; }

    public List<OfferingInstructorInputDto>? Instructors { get; set; }

    public List<OfferingWeeklySessionDto>? WeeklySessions { get; set; }

    public decimal Credits { get; set; }

    public decimal? RequiredAttendancePercent { get; set; }
}

public class OfferingInstructorInputDto
{
    [Required]
    public required Guid UserId { get; set; }

    public string? Role { get; set; }
}

public class OfferingInstructorDto
{
    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string DisplayName { get; set; }

    [Required]
    public required string Role { get; set; }

    [Required]
    public required bool IsPrimary { get; set; }
}

public class OfferingEnrollmentDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required Guid UserId { get; set; }

    [Required]
    public required string UserDisplayName { get; set; }

    public Guid? CohortGroupId { get; set; }

    public string? CohortGroupName { get; set; }
}

public class EnrollCohortRequest
{
    [Required]
    public required Guid CohortGroupId { get; set; }
}

public class EnrollProgramCohortsRequest
{
    [Required]
    public required Guid ProgramGroupId { get; set; }
}

public class EnrollLinkedProgramsRequest
{
    public bool UseLinkedPrograms { get; set; } = true;
}

public class UnenrollUserRequest
{
    [Required]
    public required Guid UserId { get; set; }
}

public class UnenrollCohortRequest
{
    [Required]
    public required Guid CohortGroupId { get; set; }
}

public class ApplyOfferingPackageRequest
{
    /// <summary>Enroll linked student groups on newly created offerings.</summary>
    public bool EnrollLinkedPrograms { get; set; } = true;

    public bool SkipExistingNames { get; set; } = true;

    /// <summary>When false, skip offerings that already exist (no extra enrollments on them).</summary>
    public bool EnrollExistingOfferings { get; set; } = false;

    /// <summary>When set, only apply package items with these names (case-insensitive).</summary>
    public List<string>? LimitToItemNames { get; set; }
}

public class ApplyOfferingPackageResultDto
{
    [Required]
    public required int OfferingsCreated { get; set; }

    [Required]
    public required int OfferingsSkipped { get; set; }

    [Required]
    public required int EnrollmentsCreated { get; set; }

    [Required]
    public required int OfferingsExistingEnrolled { get; set; }
}

public class RevertOfferingPackageResultDto
{
    [Required]
    public required int OfferingsRemoved { get; set; }

    [Required]
    public required int EnrollmentsRemoved { get; set; }
}

public class RolloverOfferingsRequest
{
    [Required]
    public required Guid SourcePeriodId { get; set; }

    public bool CopyEnrollments { get; set; }
}

public class SetupProgramTermRequest
{
    [Required]
    public required Guid ProgramGroupId { get; set; }

    /// <summary>When empty, copies offering names from the previous period for this program if any.</summary>
    public List<string>? OfferingNames { get; set; }

    public bool EnrollAllCohorts { get; set; } = true;
}

public class SetupProgramTermResultDto
{
    [Required]
    public required int OfferingsCreated { get; set; }

    [Required]
    public required int EnrollmentsCreated { get; set; }
}

public class OfferingPickerItemDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? Code { get; set; }

    [Required]
    public required Guid PeriodId { get; set; }

    public string? PeriodName { get; set; }

    public Guid? ProgramGroupId { get; set; }

    [Required]
    public required decimal Credits { get; set; }
}

public class CurrentOrganizationPeriodDto
{
    public Guid? PeriodId { get; set; }

    public string? PeriodName { get; set; }
}
