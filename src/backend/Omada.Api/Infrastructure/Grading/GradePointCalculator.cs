using Omada.Api.Entities;

namespace Omada.Api.Infrastructure.Grading;

/// <summary>
/// Weighted GPA on a 4.0 scale. Uses <see cref="Grade.LetterGrade"/> when set; otherwise maps <see cref="Grade.Score"/> to points.
/// </summary>
public static class GradePointCalculator
{
    /// <summary>
    /// Returns grade points on a 4.0 scale for one row (0–4).
    /// </summary>
    public static decimal GetGradePoints(Grade grade)
    {
        if (!string.IsNullOrWhiteSpace(grade.LetterGrade))
        {
            var p = TryParseLetterGrade(grade.LetterGrade);
            if (p.HasValue)
                return p.Value;
        }

        return ScoreToFourPointScale(grade.Score);
    }

    /// <summary>
    /// Weighted GPA: Σ(gradePoints × credits) / Σ(credits). Credits ≤ 0 are skipped.
    /// </summary>
    public static decimal CalculateWeightedGpa(IEnumerable<Grade> grades)
    {
        decimal qualityPoints = 0;
        decimal creditSum = 0;

        foreach (var g in grades)
        {
            if (g.Credits <= 0)
                continue;

            var gp = GetGradePoints(g);
            qualityPoints += gp * g.Credits;
            creditSum += g.Credits;
        }

        if (creditSum == 0)
            return 0;

        return Math.Round(qualityPoints / creditSum, 2, MidpointRounding.AwayFromZero);
    }

    private static decimal? TryParseLetterGrade(string raw)
    {
        var s = raw.Trim().ToUpperInvariant();
        return s switch
        {
            "A+" or "A" => 4.0m,
            "A-" => 3.7m,
            "B+" => 3.3m,
            "B" => 3.0m,
            "B-" => 2.7m,
            "C+" => 2.3m,
            "C" => 2.0m,
            "C-" => 1.7m,
            "D+" => 1.3m,
            "D" => 1.0m,
            "D-" => 0.7m,
            "F" => 0m,
            "P" or "PASS" => 4.0m,
            _ => null
        };
    }

    /// <summary>Maps a numeric score (assumed 0–100) to a 4.0 scale when letter grade is absent.</summary>
    private static decimal ScoreToFourPointScale(decimal score)
    {
        if (score >= 93) return 4.0m;
        if (score >= 90) return 3.7m;
        if (score >= 87) return 3.3m;
        if (score >= 83) return 3.0m;
        if (score >= 80) return 2.7m;
        if (score >= 77) return 2.3m;
        if (score >= 73) return 2.0m;
        if (score >= 70) return 1.7m;
        if (score >= 67) return 1.3m;
        if (score >= 65) return 1.0m;
        if (score >= 60) return 0.7m;
        return 0m;
    }
}
