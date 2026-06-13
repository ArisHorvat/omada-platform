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
    /// <summary>Legacy optional catalog link on offerings — not in the admin group picker; use <see cref="CourseOffering.Name"/> instead.</summary>
    public const string Subject = "subject";
    public const string Series = "series";
    /// <summary>Legacy alias for <see cref="Group"/>.</summary>
    public const string Class = "class";
    /// <summary>Legacy alias for <see cref="Group"/>.</summary>
    public const string Cohort = "cohort";
    /// <summary>Stable student group for the academic year (e.g. Group 111).</summary>
    public const string Group = "group";
    public const string Subgroup = "subgroup";

    public static string Normalize(string? type) =>
        string.IsNullOrWhiteSpace(type) ? Group : type.Trim().ToLowerInvariant();

    public static bool IsDepartmentLike(string type)
    {
        var t = Normalize(type);
        return t is Department or Division or Faculty;
    }

    /// <summary>Student placement group (members enroll in offerings; schedule/attendance attach here).</summary>
    public static bool IsStudentGroup(string type)
    {
        var t = Normalize(type);
        return t is Group or Cohort or Class;
    }

    public static bool IsStudentPlacementGroup(string type)
    {
        var t = Normalize(type);
        return IsStudentGroup(t) || t is Subgroup;
    }

    public static bool IsSessionManagedGroup(string type) => IsStudentPlacementGroup(type);

    public static IReadOnlyList<GroupTypeOption> GetCatalog(OrganizationType orgType) =>
        orgType == OrganizationType.University ? UniversityCatalog : CorporateCatalog;

    public static string GetDisplayLabel(OrganizationType orgType, string? type)
    {
        var key = Normalize(type);
        foreach (var option in GetCatalog(orgType))
        {
            if (option.Key == key)
                return option.Label;
        }

        return key switch
        {
            Cohort or Class => GetCatalog(orgType).First(o => o.Key == Group).Label,
            Subject => "Subject (legacy)",
            _ => key
        };
    }

    public static bool MatchesTypeFilter(string nodeType, string filterKey)
    {
        var node = Normalize(nodeType);
        var filter = Normalize(filterKey);
        if (node == filter)
            return true;
        if (filter == Group && IsStudentGroup(node))
            return true;
        return false;
    }

    /// <summary>
    /// University structure tree. Term courses live in <see cref="CourseOffering"/> — not as subject groups.
    /// Faculty → Department → Program → Series → Group → Subgroup.
    /// </summary>
    private static readonly IReadOnlyList<GroupTypeOption> UniversityCatalog =
    [
        new(Faculty, "Faculty", "Top-level academic unit (e.g. Faculty of Mathematics).", null),
        new(Department, "Department", "Department under a faculty.", Faculty),
        new(Program, "Program", "Degree program or specialization track.", Department),
        new(Series, "Series", "Parallel track or study year under a program (e.g. Year 1).", Program),
        new(Group, "Group", "Stable student group for the full academic year (e.g. Group 111).", Series),
        new(Subgroup, "Subgroup", "Lab or seminar split under a group (e.g. Group 111 Lab 1).", Group),
    ];

    private static readonly IReadOnlyList<GroupTypeOption> CorporateCatalog =
    [
        new(Division, "Division", "Business division or business unit.", null),
        new(Department, "Department", "Department within a division.", Division),
        new(Team, "Team", "Team reporting to a department.", Department),
        new(Squad, "Squad", "Sub-team within a team.", Team),
        new(Project, "Project", "Cross-functional or temporary project group.", Team),
    ];

    public sealed record GroupTypeOption(
        string Key,
        string Label,
        string Description,
        string? SuggestedParentType);
}
