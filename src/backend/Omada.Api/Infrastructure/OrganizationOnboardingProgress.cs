using System.Text.Json;
using Omada.Api.Entities;

namespace Omada.Api.Infrastructure;

public static class OrganizationOnboardingProgress
{
    public static class StepIds
    {
        public const string Widgets = "widgets";
        public const string Roles = "roles";
        public const string Branding = "branding";
        public const string Periods = "periods";
        public const string Groups = "groups";
        public const string Floorplan = "floorplan";
        public const string Spider = "spider";
        public const string Invite = "invite";
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static HashSet<string> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var steps = JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
            if (steps == null || steps.Count == 0)
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            return steps
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        }
    }

    public static string? Serialize(IEnumerable<string> steps)
    {
        var normalized = steps
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(s => s, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return normalized.Count == 0 ? null : JsonSerializer.Serialize(normalized, JsonOptions);
    }

    public static IReadOnlyList<string> GetCompletedSteps(Organization org) =>
        Parse(org.OnboardingCompletedStepsJson).OrderBy(s => s, StringComparer.OrdinalIgnoreCase).ToList();

    public static bool IsComplete(Organization org, string stepId) =>
        Parse(org.OnboardingCompletedStepsJson).Contains(stepId);

    public static void MarkComplete(Organization org, string stepId)
    {
        var set = Parse(org.OnboardingCompletedStepsJson);
        set.Add(stepId.Trim());
        org.OnboardingCompletedStepsJson = Serialize(set);
    }

    public static void MergeCompletedSteps(Organization org, IEnumerable<string>? stepIds)
    {
        if (stepIds == null)
            return;

        var set = Parse(org.OnboardingCompletedStepsJson);
        foreach (var stepId in stepIds.Where(s => !string.IsNullOrWhiteSpace(s)))
            set.Add(stepId.Trim());

        org.OnboardingCompletedStepsJson = Serialize(set);
    }
}
