using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class CourseOfferingPackageDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? Description { get; set; }

    [Required]
    public required IReadOnlyList<Guid> ProgramGroupIds { get; set; }

    [Required]
    public required IReadOnlyList<string> ProgramGroupNames { get; set; }

    [Required]
    public required IReadOnlyList<CourseOfferingPackageItemDto> Items { get; set; }

    [Required]
    public required DateTime CreatedAt { get; set; }
}

public class CourseOfferingPackageItemDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? Code { get; set; }

    public string? Description { get; set; }

    [Required]
    public required int SortOrder { get; set; }

    public Guid? DefaultHostId { get; set; }

    public string? DefaultHostName { get; set; }

    [Required]
    public required IReadOnlyList<OfferingInstructorDto> Instructors { get; set; }

    [Required]
    public required IReadOnlyList<Guid> ProgramGroupIds { get; set; }

    [Required]
    public required IReadOnlyList<string> ProgramGroupNames { get; set; }

    [Required]
    public required IReadOnlyList<OfferingWeeklySessionDto> WeeklySessions { get; set; }

    [Required]
    public required decimal Credits { get; set; }
}

public class CreateCourseOfferingPackageRequest
{
    [Required]
    public required string Name { get; set; }

    public string? Description { get; set; }

    public List<Guid>? ProgramGroupIds { get; set; }
}

public class UpdateCourseOfferingPackageRequest
{
    [Required]
    public required string Name { get; set; }

    public string? Description { get; set; }

    public List<Guid>? ProgramGroupIds { get; set; }
}

public class UpsertCourseOfferingPackageItemRequest
{
    public Guid? Id { get; set; }

    [Required]
    public required string Name { get; set; }

    public string? Code { get; set; }

    public string? Description { get; set; }

    public int SortOrder { get; set; }

    public Guid? DefaultHostId { get; set; }

    public string? DefaultHostName { get; set; }

    public List<OfferingInstructorInputDto>? Instructors { get; set; }

    public List<Guid>? ProgramGroupIds { get; set; }

    public List<OfferingWeeklySessionDto>? WeeklySessions { get; set; }

    public decimal Credits { get; set; }
}

public class SaveCourseOfferingPackageItemsRequest
{
    [Required]
    public required List<UpsertCourseOfferingPackageItemRequest> Items { get; set; }
}
