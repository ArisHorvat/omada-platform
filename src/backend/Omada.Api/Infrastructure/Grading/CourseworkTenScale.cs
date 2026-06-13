using Omada.Api.Entities;

namespace Omada.Api.Infrastructure.Grading;

public static class CourseworkTenScale
{
    public static decimal ClampTen(decimal value) =>
        Math.Round(Math.Max(1m, Math.Min(10m, value)) * 10m) / 10m;

    public static decimal ScoreToTenScale(decimal score, int? maxScore)
    {
        if (maxScore is > 0)
            return ClampTen(1m + (score / maxScore.Value) * 9m);

        if (score <= 10m)
            return ClampTen(score);

        return ClampTen(1m + (score / 100m) * 9m);
    }

    public static decimal TaskWeight(TaskItem task, OfferingGradeCategory? category)
    {
        decimal? w = null;
        if (category != null && task.Weight.HasValue)
            w = category.Weight * task.Weight.Value;
        else if (category != null)
            w = category.Weight;
        else
            w = task.Weight;

        if (w is not > 0)
            return 1m;

        return w <= 1m ? w.Value : w.Value / 100m;
    }

    public static decimal? ComputeWeightedTenGrade(
        IEnumerable<TaskItem> tasks,
        IReadOnlyDictionary<Guid, OfferingGradeCategory> categories)
    {
        decimal weighted = 0;
        decimal totalWeight = 0;

        foreach (var task in tasks)
        {
            if (task.Grade is not { } grade)
                continue;

            categories.TryGetValue(task.GradeCategoryId ?? Guid.Empty, out var category);
            var ten = ScoreToTenScale(grade, task.MaxScore);
            var weight = TaskWeight(task, category);
            weighted += ten * weight;
            totalWeight += weight;
        }

        if (totalWeight <= 0)
            return null;

        return ClampTen(weighted / totalWeight);
    }

    public static string ResolveAssignmentStatus(TaskItem task, DateTime utcNow)
    {
        if (task.Grade.HasValue)
            return "graded";

        if (task.IsCompleted)
            return "submitted";

        if (task.DueDate.HasValue && task.DueDate.Value < utcNow)
            return "overdue";

        return "pending";
    }
}
