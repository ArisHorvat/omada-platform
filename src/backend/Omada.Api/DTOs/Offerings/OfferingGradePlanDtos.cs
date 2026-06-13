using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Offerings;

public class OfferingGradeCategoryDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Name { get; set; }

    /// <summary>Share of final grade (0–1).</summary>
    [Required]
    public required decimal Weight { get; set; }

    [Required]
    public required int SortOrder { get; set; }

    [Required]
    public required bool IsBonus { get; set; }

    /// <summary>Sum of <see cref="GradePlanTaskItemDto.Weight"/> values in this category (should be ≤ 1).</summary>
    [Required]
    public required decimal AssignedWeightSum { get; set; }

    [Required]
    public required IReadOnlyList<GradePlanTaskItemDto> Tasks { get; set; }
}

public class GradePlanTaskItemDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public required string Title { get; set; }

    public Guid? AssignmentBatchId { get; set; }

    /// <summary>Weight within the parent category (0–1).</summary>
    public decimal? Weight { get; set; }

    public int? MaxScore { get; set; }

    public DateTime? DueDate { get; set; }
}

public class OfferingGradePlanDto
{
    [Required]
    public required Guid OfferingId { get; set; }

    [Required]
    public required string OfferingName { get; set; }

    [Required]
    public required IReadOnlyList<OfferingGradeCategoryDto> Categories { get; set; }

    /// <summary>Sum of non-bonus category weights (target 1.0).</summary>
    [Required]
    public required decimal CoreWeightSum { get; set; }

    [Required]
    public required decimal BonusWeightSum { get; set; }

    /// <summary>Only the course host may change category weights.</summary>
    [Required]
    public required bool CanEditGradePlan { get; set; }
}

public class UpsertOfferingGradeCategoryRequest
{
    public Guid? Id { get; set; }

    [Required]
    public required string Name { get; set; }

    [Required]
    public required decimal Weight { get; set; }

    public int SortOrder { get; set; }

    public bool IsBonus { get; set; }
}

public class SaveOfferingGradePlanRequest
{
    [Required]
    public required List<UpsertOfferingGradeCategoryRequest> Categories { get; set; }
}
