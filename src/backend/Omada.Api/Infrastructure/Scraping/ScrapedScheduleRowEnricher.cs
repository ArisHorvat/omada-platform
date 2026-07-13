using System.Text.RegularExpressions;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Infrastructure.Scraping;

/// <summary>
/// Normalizes scraped rows when the course name lives in the page title (single-offering timetables).
/// </summary>
public static class ScrapedScheduleRowEnricher
{
    private static readonly Regex TrailingParenType = new(@"\s*\([^)]*\)\s*$", RegexOptions.Compiled);

    private static readonly HashSet<string> ActivityOnlyLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        "Curs", "Laborator", "Seminar", "Proiect", "Consultatie", "Session", "Other",
    };

    private static readonly Regex OrarTitleWithSubject = new(
        @"^orar\s*(?:[-–]\s*)?(?:[A-Za-z0-9.\s]+?)\s*[:\-–]\s*(.+)$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex CourseCodeOnly = new(
        @"^[A-Za-z]{1,6}\d{2,5}[A-Za-z]?$",
        RegexOptions.Compiled);

    private static readonly Regex ProfessorSeparators = new(
        @"[/,;]|(?:\s+(?:and|și|si)\s+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Extracts discipline name from schedule page titles like "Orar MM123: Linear Algebra".
    /// </summary>
    public static string? ParseSchedulePageTitle(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        var text = HtmlDecodeLite(raw.Trim());
        if (text.Length < 3)
            return null;

        var orarMatch = OrarTitleWithSubject.Match(text);
        if (orarMatch.Success)
        {
            var subject = orarMatch.Groups[1].Value.Trim();
            if (IsUsableCourseName(subject))
                return subject;
        }

        if (text.StartsWith("orar", StringComparison.OrdinalIgnoreCase))
        {
            var colon = text.IndexOf(':');
            if (colon >= 0 && colon < text.Length - 1)
            {
                var afterColon = text[(colon + 1)..].Trim();
                if (IsUsableCourseName(afterColon))
                    return afterColon;
            }
        }

        if (IsUsableCourseName(text) && !text.StartsWith("orar", StringComparison.OrdinalIgnoreCase))
            return text;

        return null;
    }

    private static bool IsUsableCourseName(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        var t = text.Trim();
        if (t.Length < 3)
            return false;

        if (IsProgramOrGroupPageCode(t))
            return false;

        if (CourseCodeOnly.IsMatch(t.Replace(" ", string.Empty)))
            return false;

        if (IsActivityOnlyLabel(t))
            return false;

        return true;
    }

    private static string HtmlDecodeLite(string value) =>
        System.Net.WebUtility.HtmlDecode(value).Trim();

    public static IEnumerable<string> SplitProfessorLabels(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            yield break;

        var trimmed = raw.Trim();
        var parts = ProfessorSeparators.Split(trimmed)
            .Select(p => p.Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToList();

        if (parts.Count == 0)
        {
            yield return trimmed;
            yield break;
        }

        foreach (var part in parts)
            yield return part;
    }

    public static List<ScrapedEventDto> EnrichRows(
        IEnumerable<ScrapedEventDto> events,
        string? implicitCourseName = null)
    {
        return events.Select(e => EnrichRow(e, implicitCourseName)).ToList();
    }

    public static ScrapedEventDto EnrichRow(ScrapedEventDto row, string? implicitCourseName = null)
    {
        var courseHint = ResolveCourseHint(row, implicitCourseName);
        if (IsProgramOrGroupPageCode(courseHint))
            courseHint = null;

        if (string.IsNullOrWhiteSpace(courseHint))
            return row;

        var className = (row.ClassName ?? string.Empty).Trim();
        var activity = (row.ActivityType ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(className))
        {
            row.ClassName = courseHint;
            return row;
        }

        if (IsActivityOnlyLabel(className))
        {
            if (string.IsNullOrWhiteSpace(activity))
                row.ActivityType = NormalizeActivityLabel(className);
            row.ClassName = courseHint;
        }

        return row;
    }

    public static string ResolveCourseHint(ScrapedEventDto row, string? implicitCourseName)
    {
        if (!string.IsNullOrWhiteSpace(implicitCourseName))
            return implicitCourseName.Trim();

        return InferCourseFromPageHeading(row.GroupNumber)
               ?? InferCourseFromSourceUrl(row.SourcePageUrl);
    }

    public static bool IsActivityOnlyLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
            return false;

        // Exact match only — discipline names like "Proiect de cercetare" must not match
        // because NormalizeActivityLabel treats any "proiect" substring as activity type.
        var trimmed = TrailingParenType.Replace(label, string.Empty).Trim();
        return ActivityOnlyLabels.Contains(trimmed);
    }

    /// <summary>
    /// Program / year group page codes (e.g. IE3, I1) — not course discipline names.
    /// </summary>
    public static bool IsProgramOrGroupPageCode(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        var t = text.Trim();
        if (Regex.IsMatch(t, @"^(I|M|D)\d+$", RegexOptions.IgnoreCase))
            return true;

        return t.Length <= 4 && Regex.IsMatch(t, @"^[A-Z]+\d+$", RegexOptions.IgnoreCase);
    }

    public static string NormalizeSubjectLabel(string? className)
    {
        var t = TrailingParenType.Replace(className ?? string.Empty, string.Empty).Trim();
        return string.Join(' ', t.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }

    public static string NormalizeActivityLabel(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        var t = raw.Trim();
        if (t.Contains("laborator", StringComparison.OrdinalIgnoreCase))
            return "Laborator";
        if (t.Contains("seminar", StringComparison.OrdinalIgnoreCase))
            return "Seminar";
        if (t.Contains("curs", StringComparison.OrdinalIgnoreCase))
            return "Curs";
        if (t.Contains("proiect", StringComparison.OrdinalIgnoreCase))
            return "Proiect";
        if (t.Contains("consult", StringComparison.OrdinalIgnoreCase))
            return "Consultatie";
        if (t.Contains("practic", StringComparison.OrdinalIgnoreCase))
            return "Practica";
        return t;
    }

    private static string? InferCourseFromPageHeading(string? groupNumber)
    {
        // Not used for course — reserved for future page context field.
        return null;
    }

    private static string? InferCourseFromSourceUrl(string? sourcePageUrl)
    {
        if (string.IsNullOrWhiteSpace(sourcePageUrl))
            return null;

        try
        {
            var file = Uri.UnescapeDataString(sourcePageUrl.Split('/').LastOrDefault() ?? string.Empty);
            var baseName = Path.GetFileNameWithoutExtension(file);
            if (string.IsNullOrWhiteSpace(baseName))
                return null;

            if (IsProgramOrGroupPageCode(baseName))
                return null;

            var fromTitle = ParseSchedulePageTitle(baseName.Replace('-', ' ').Replace('_', ' '));
            if (!string.IsNullOrWhiteSpace(fromTitle))
                return fromTitle;

            var spaced = baseName.Replace('-', ' ').Replace('_', ' ').Trim();
            if (!IsUsableCourseName(spaced))
                return null;

            return spaced;
        }
        catch
        {
            return null;
        }
    }
}
