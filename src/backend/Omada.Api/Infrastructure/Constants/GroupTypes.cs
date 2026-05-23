using Omada.Api.Entities;

namespace Omada.Api.Infrastructure.Constants;

/// <summary>
/// Canonical group type keys (stored lowercase on <see cref="Group.Type"/>).
/// Hierarchy is expressed via <see cref="Group.ParentGroupId"/>; labels vary by <see cref="OrganizationType"/>.
/// </summary>
public static class GroupTypes
{
    public const string Department = "department";
    public const string Team = "team";
    public const string Division = "division";
    public const string Squad = "squad";
    public const string Project = "project";

    public const string Faculty = "faculty";
    public const string Program = "program";
    public const string Subject = "subject";
    public const string Series = "series";
    public const string Class = "class";
    public const string Subgroup = "subgroup";

    public static string Normalize(string? type) =>
        string.IsNullOrWhiteSpace(type) ? Class : type.Trim().ToLowerInvariant();

    public static bool IsDepartmentLike(string type)
    {
        var t = Normalize(type);
        return t is Department or Division or Faculty;
    }

    public static IReadOnlyList<GroupTypeOption> GetCatalog(OrganizationType orgType) =>
        orgType == OrganizationType.University ? UniversityCatalog : CorporateCatalog;

    private static readonly IReadOnlyList<GroupTypeOption> UniversityCatalog =
    [
        new(Faculty, "Faculty", "Top-level academic unit (e.g. Faculty of Mathematics).", null),
        new(Department, "Department", "Department under a faculty.", Faculty),
        new(Program, "Program", "Degree program or specialization track.", Department),
        new(Subject, "Subject / course", "Course or subject (e.g. Linear Algebra).", Program),
        new(Series, "Series", "Parallel series when cohorts are split (e.g. Series A/B).", Subject),
        new(Class, "Class / group", "Teaching group linked to timetable and attendance.", Series),
        new(Subgroup, "Subgroup", "Smaller split (seminar, lab group).", Class),
    ];

    private static readonly IReadOnlyList<GroupTypeOption> CorporateCatalog =
    [
        new(Division, "Division", "Business division or business unit.", null),
        new(Department, "Department", "Department within a division.", Division),
        new(Team, "Team", "Team reporting to a department.", Department),
        new(Squad, "Squad", "Sub-team or squad within a team.", Team),
        new(Project, "Project", "Cross-functional or temporary project group.", Team),
    ];

    public sealed record GroupTypeOption(
        string Key,
        string Label,
        string Description,
        string? SuggestedParentType);
}
