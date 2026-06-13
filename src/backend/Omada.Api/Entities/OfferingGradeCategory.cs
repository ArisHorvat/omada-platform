namespace Omada.Api.Entities;

/// <summary>
/// Top-level grade bucket for a course offering (exam, lab, colloquium, seminar, bonus).
/// Task weights inside the category are stored on <see cref="TaskItem.Weight"/>.
/// </summary>
public class OfferingGradeCategory : BaseEntity, IOrganizationScoped
{
    public Guid OrganizationId { get; set; }

    public Guid OfferingId { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Share of the final course grade (0–1). Bonus categories may exceed the 100% core sum.</summary>
    public decimal Weight { get; set; }

    public int SortOrder { get; set; }

    /// <summary>When true, weight is extra credit and not counted toward the 100% core total.</summary>
    public bool IsBonus { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual CourseOffering Offering { get; set; } = null!;
}
