using System.Globalization;
using System.Text.RegularExpressions;
using Omada.Api.Entities;

namespace Omada.Api.Infrastructure;

/// <summary>
/// Expands recurring <see cref="Event"/> rows into occurrence start times (matches timetable publish / expected attendance seeding).
/// </summary>
public static class EventOccurrenceExpander
{
    public static IEnumerable<DateTime> ExpandOccurrenceStarts(Event evt, DateTime rangeStart, DateTime rangeEnd)
    {
        if (string.IsNullOrEmpty(evt.RecurrenceRule))
        {
            if (evt.StartTime >= rangeStart && evt.StartTime < rangeEnd)
                yield return evt.StartTime;
            yield break;
        }

        var rule = evt.RecurrenceRule;
        var interval = 1;
        var intervalMatch = Regex.Match(rule, "INTERVAL=(\\d+)");
        if (intervalMatch.Success)
            interval = int.Parse(intervalMatch.Groups[1].Value);

        DateTime? untilDate = null;
        var untilMatch = Regex.Match(rule, "UNTIL=(\\d{8}T\\d{6}Z)");
        if (untilMatch.Success &&
            DateTime.TryParseExact(untilMatch.Groups[1].Value, "yyyyMMddTHHmmssZ",
                null, DateTimeStyles.AdjustToUniversal, out var parsedUntil))
        {
            untilDate = parsedUntil;
        }

        var isWeekly = rule.Contains("FREQ=WEEKLY");
        var isMonthly = rule.Contains("FREQ=MONTHLY");
        var current = evt.StartTime;

        while (current < rangeEnd)
        {
            if (untilDate.HasValue && current > untilDate.Value)
                break;

            if (current >= rangeStart)
                yield return current;

            if (isWeekly)
                current = current.AddDays(7 * interval);
            else if (isMonthly)
                current = current.AddMonths(interval);
            else
                yield break;
        }
    }

    /// <summary>Past session instances for an event within [rangeStart, rangeEnd) whose end time is on or before <paramref name="asOfUtc"/>.</summary>
    public static HashSet<(Guid EventId, DateTime InstanceDate)> CollectHeldInstances(
        Event evt,
        DateTime rangeStart,
        DateTime rangeEnd,
        DateTime asOfUtc)
    {
        var held = new HashSet<(Guid, DateTime)>();
        var duration = evt.EndTime - evt.StartTime;

        foreach (var instanceStart in ExpandOccurrenceStarts(evt, rangeStart, rangeEnd))
        {
            if (instanceStart.Add(duration) <= asOfUtc)
                held.Add((evt.Id, instanceStart.Date));
        }

        return held;
    }
}
