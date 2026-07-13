using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Omada.Api.Infrastructure.Scraping;

/// <summary>Parses scraped timetable time cells into Omada weekly-session fields (day, start, duration, frequency).</summary>
public static class ScheduleTimeParser
{
    private static readonly Regex TimeRangeRegex = new(
        @"(\d{1,2})\s*[:\.]\s*(\d{2})\s*[-–—/]\s*(\d{1,2})\s*[:\.]\s*(\d{2})",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HourOnlyRangeRegex = new(
        @"(?<!\d)(\d{1,2})\s*[-–—/]\s*(\d{1,2})(?!\s*[:\.]\d)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex SaptIntervalRegex = new(
        @"(?i)sapt[\s.\-_/]*(\d+)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex SaptIntervalLeadingRegex = new(
        @"(?i)(\d+)[\s.\-_/]*sapt",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex SaptTokenRegex = new(
        @"(?i)sapt[\s.\-_/]*\d+",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex SingleTimeRegex = new(
        @"(?<!\d)(\d{1,2})\s*[:\.]\s*(\d{2})(?!\s*[-–—/])",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Dictionary<string, int> DayTokens = BuildDayTokens();

    public sealed record ParseResult(
        int? DayOfWeek,
        string? StartTimeLocal,
        decimal? HoursPerSession,
        string Frequency,
        int? BiweeklyPhase,
        bool Parsed,
        string? DayLabel,
        string? HoursLabel,
        string? FrequencyLabel,
        string? Warning);

    /// <summary>Enrich from optional split labels and/or combined <paramref name="timeRaw"/>.</summary>
    public static ParseResult Parse(
        string? timeRaw,
        string? dayLabel = null,
        string? hoursLabel = null,
        string? frequencyLabel = null)
    {
        var dayText = FirstNonEmpty(dayLabel, ExtractDayToken(timeRaw));
        var hoursText = FirstNonEmpty(hoursLabel, ExtractHoursToken(StripSaptTokens(timeRaw)));
        var freqText = FirstNonEmpty(frequencyLabel, ExtractFrequencyToken(timeRaw));
        var phaseSource = string.Join(
            " ",
            new[] { timeRaw, dayLabel, hoursLabel, frequencyLabel }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var (frequency, biweeklyPhase) = ParseFrequencyWithPhase(freqText, phaseSource);

        var dayOfWeek = ParseDayOfWeek(dayText);
        var (start, end, hours) = ParseHoursRange(hoursText);

        var parsed = dayOfWeek.HasValue && !string.IsNullOrWhiteSpace(start) && hours.HasValue;
        string? warning = null;
        if (!parsed)
        {
            var parts = new List<string>();
            if (!dayOfWeek.HasValue && !string.IsNullOrWhiteSpace(dayText))
                parts.Add("day");
            if (string.IsNullOrWhiteSpace(start) || !hours.HasValue)
                parts.Add("time range");
            warning = parts.Count > 0
                ? $"Could not parse {string.Join(" and ", parts)} from scraped cell."
                : "Time cell was empty or unrecognized.";
        }

        return new ParseResult(
            dayOfWeek,
            start,
            hours,
            frequency,
            biweeklyPhase,
            parsed,
            dayText,
            hoursText,
            freqText,
            warning);
    }

    public static string ParseFrequency(string? frequencyText) =>
        ParseFrequencyWithPhase(frequencyText).Frequency;

    /// <summary>
    /// Romanian scrape semantics:
    /// sapt. 1 = odd term weeks (week 1, 3, 5…); sapt. 2 = even term weeks (week 2, 4, 6…).
    /// Both are biweekly with a phase offset from the period start.
    /// </summary>
    public static (string Frequency, int? BiweeklyPhase) ParseFrequencyWithPhase(
        string? frequencyText,
        string? timeRaw = null)
    {
        var combined = string.Join(
            " ",
            new[] { frequencyText, timeRaw }.Where(s => !string.IsNullOrWhiteSpace(s)));

        if (string.IsNullOrWhiteSpace(combined))
            return ("weekly", null);

        var saptInterval = TryParseSaptInterval(combined);
        if (saptInterval == 1)
            return ("biweekly", 1);
        if (saptInterval == 2)
            return ("biweekly", 2);
        if (saptInterval is > 2)
            return ("biweekly", null);

        var key = NormalizeToken(combined);

        if (IsEveryTwoWeeks(combined, key))
            return ("biweekly", 1);

        if (ContainsToken(key, "impar") || ContainsToken(key, "odd"))
            return ("biweekly", 1);

        if (ContainsToken(key, "par") || ContainsToken(key, "even"))
            return ("biweekly", 2);

        if (key.Contains("para", StringComparison.Ordinal)
            || key.Contains("biweek", StringComparison.Ordinal)
            || key.Contains("altern", StringComparison.Ordinal))
        {
            return ("biweekly", 1);
        }

        if (key.Contains("lunar", StringComparison.Ordinal) || key.Contains("month", StringComparison.Ordinal))
            return ("monthly", null);

        if (key.Contains("as_needed", StringComparison.Ordinal) || key.Contains("optional", StringComparison.Ordinal))
            return ("as_needed", null);

        return ("weekly", null);
    }

    private static bool ContainsToken(string normalized, string token) =>
        Regex.IsMatch(normalized, $@"\b{Regex.Escape(token)}\b", RegexOptions.CultureInvariant);

    private static bool IsEveryTwoWeeks(string raw, string normalized)
    {
        if (normalized.Contains("every", StringComparison.Ordinal)
            && normalized.Contains("week", StringComparison.Ordinal)
            && (normalized.Contains('2') || normalized.Contains("two", StringComparison.Ordinal)))
            return true;

        return Regex.IsMatch(
            raw,
            @"(?i)every\s*(2|two)\s*week",
            RegexOptions.CultureInvariant);
    }

    private static string StripSaptTokens(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var stripped = SaptTokenRegex.Replace(text, " ");
        return Regex.Replace(stripped, @"\s+", " ").Trim();
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var v in values)
        {
            if (!string.IsNullOrWhiteSpace(v))
                return v.Trim();
        }

        return null;
    }

    private static string? ExtractDayToken(string? timeRaw)
    {
        if (string.IsNullOrWhiteSpace(timeRaw))
            return null;

        foreach (var token in Tokenize(timeRaw))
        {
            var key = NormalizeToken(token);
            if (DayTokens.ContainsKey(key))
                return token;
        }

        return null;
    }

    private static string? ExtractHoursToken(string? timeRaw)
    {
        if (string.IsNullOrWhiteSpace(timeRaw))
            return null;

        var cleaned = StripSaptTokens(timeRaw);

        var match = TimeRangeRegex.Match(cleaned);
        if (match.Success)
            return match.Value;

        match = HourOnlyRangeRegex.Match(cleaned);
        if (match.Success)
            return match.Value;

        var single = SingleTimeRegex.Match(cleaned);
        return single.Success ? single.Value : null;
    }

    private static string? ExtractFrequencyToken(string? timeRaw)
    {
        if (string.IsNullOrWhiteSpace(timeRaw))
            return null;

        var saptMatch = SaptTokenRegex.Match(timeRaw);
        if (saptMatch.Success)
            return saptMatch.Value.Trim();

        foreach (var token in Tokenize(timeRaw))
        {
            var key = NormalizeToken(token);
            if (IsFrequencyToken(key))
                return token;
        }

        if (IsEveryTwoWeeks(timeRaw, NormalizeToken(timeRaw)))
            return "every 2 weeks";

        return null;
    }

    private static IEnumerable<string> Tokenize(string raw) =>
        raw.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

    private static bool IsFrequencyToken(string normalized)
    {
        if (string.IsNullOrEmpty(normalized))
            return false;

        return normalized.Contains("sapt", StringComparison.Ordinal)
               || normalized.Contains("week", StringComparison.Ordinal)
               || normalized.Contains("para", StringComparison.Ordinal)
               || normalized.Contains("lunar", StringComparison.Ordinal)
               || normalized.Contains("month", StringComparison.Ordinal)
               || normalized is "par" or "impar" or "odd" or "even";
    }

    public static int? ParseDayOfWeek(string? dayText)
    {
        if (string.IsNullOrWhiteSpace(dayText))
            return null;

        foreach (var candidate in EnumerateDayCandidates(dayText))
        {
            var key = NormalizeToken(candidate);
            if (DayTokens.TryGetValue(key, out var dow))
                return dow;

            foreach (var pair in DayTokens)
            {
                if (key.StartsWith(pair.Key, StringComparison.Ordinal) && pair.Key.Length >= 3)
                    return pair.Value;
            }
        }

        return null;
    }

    private static IEnumerable<string> EnumerateDayCandidates(string dayText)
    {
        yield return dayText;

        var beforeParen = dayText.Split('(')[0].Trim();
        if (!string.IsNullOrWhiteSpace(beforeParen))
            yield return beforeParen;

        var first = dayText.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(first))
            yield return first;
    }

    public static (string? StartTimeLocal, string? EndTimeLocal, decimal? Hours) ParseHoursRange(string? hoursText)
    {
        if (string.IsNullOrWhiteSpace(hoursText))
            return (null, null, null);

        var match = TimeRangeRegex.Match(hoursText);
        if (match.Success
            && int.TryParse(match.Groups[1].Value, out var sh)
            && int.TryParse(match.Groups[2].Value, out var sm)
            && int.TryParse(match.Groups[3].Value, out var eh)
            && int.TryParse(match.Groups[4].Value, out var em))
        {
            var start = FormatTime(sh, sm);
            var end = FormatTime(eh, em);
            var hours = ComputeDurationHours(sh, sm, eh, em);
            return hours > 0 ? (start, end, hours) : (start, end, null);
        }

        match = HourOnlyRangeRegex.Match(hoursText);
        if (match.Success
            && int.TryParse(match.Groups[1].Value, out var sh2)
            && int.TryParse(match.Groups[2].Value, out var eh2))
        {
            var start = FormatTime(sh2, 0);
            var end = FormatTime(eh2, 0);
            var hours = ComputeDurationHours(sh2, 0, eh2, 0);
            return hours > 0 ? (start, end, hours) : (start, end, null);
        }

        var single = SingleTimeRegex.Match(hoursText);
        if (single.Success
            && int.TryParse(single.Groups[1].Value, out var h)
            && int.TryParse(single.Groups[2].Value, out var m))
        {
            return (FormatTime(h, m), null, 2m);
        }

        return (null, null, null);
    }

    /// <summary>Romanian scrape tokens: sapt. 1 / sapt. 2 week parity within the term.</summary>
    private static int? TryParseSaptInterval(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        if (!text.Contains("sapt", StringComparison.OrdinalIgnoreCase))
            return null;

        var trailingDigit = SaptIntervalRegex.Match(text);
        if (trailingDigit.Success && int.TryParse(trailingDigit.Groups[1].Value, out var after))
            return after;

        var leadingDigit = SaptIntervalLeadingRegex.Match(text);
        if (leadingDigit.Success && int.TryParse(leadingDigit.Groups[1].Value, out var before))
            return before;

        return null;
    }

    private static decimal ComputeDurationHours(int sh, int sm, int eh, int em)
    {
        var startMinutes = sh * 60 + sm;
        var endMinutes = eh * 60 + em;
        if (endMinutes <= startMinutes)
            endMinutes += 24 * 60;
        return Math.Round((endMinutes - startMinutes) / 60m, 2);
    }

    private static string FormatTime(int hour, int minute)
    {
        hour = Math.Clamp(hour, 0, 23);
        minute = Math.Clamp(minute, 0, 59);
        minute = minute / 15 * 15;
        return $"{hour:D2}:{minute:D2}";
    }

    private static string NormalizeToken(string value)
    {
        var s = value.Trim().ToLowerInvariant();
        s = RemoveDiacritics(s);
        return s.Trim('.', ',', ';', ':');
    }

    private static string RemoveDiacritics(string text)
    {
        var normalized = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    private static Dictionary<string, int> BuildDayTokens()
    {
        var map = new Dictionary<string, int>(StringComparer.Ordinal);
        void Add(int dow, params string[] tokens)
        {
            foreach (var t in tokens)
                map[NormalizeToken(t)] = dow;
        }

        Add(1, "luni", "monday", "mon", "mo");
        Add(2, "marti", "marți", "tuesday", "tue", "tues", "tu");
        Add(3, "miercuri", "wednesday", "wed", "we");
        Add(4, "joi", "thursday", "thu", "th", "thur");
        Add(5, "vineri", "friday", "fri", "fr");
        Add(6, "sambata", "sâmbătă", "saturday", "sat", "sa");
        Add(0, "duminica", "duminică", "sunday", "sun", "su");
        return map;
    }
}
