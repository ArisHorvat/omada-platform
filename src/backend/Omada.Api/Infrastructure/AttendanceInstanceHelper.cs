using Omada.Api.Entities;

namespace Omada.Api.Infrastructure;

/// <summary>
/// Canonical occurrence instants for <see cref="EventAttendance"/> rows.
/// </summary>
public static class AttendanceInstanceHelper
{
    public static DateTime AsUtcScheduleInstant(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    public static DateTime TruncateToMinute(DateTime value)
    {
        var utc = AsUtcScheduleInstant(value);
        return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute, 0, DateTimeKind.Utc);
    }

    /// <summary>
    /// Map a requested calendar day (or exact instant) to the event occurrence start for that day.
    /// </summary>
    public static DateTime ResolveOccurrenceInstance(Event evt, DateTime requestedInstance)
    {
        var eventStart = TruncateToMinute(AsUtcScheduleInstant(evt.StartTime));
        if (string.IsNullOrEmpty(evt.RecurrenceRule))
            return eventStart;

        var requestDay = AsUtcScheduleInstant(requestedInstance).Date;
        return new DateTime(
            requestDay.Year,
            requestDay.Month,
            requestDay.Day,
            eventStart.Hour,
            eventStart.Minute,
            0,
            DateTimeKind.Utc);
    }

    public static bool InstanceMatches(DateTime stored, DateTime target) =>
        TruncateToMinute(AsUtcScheduleInstant(stored)) == TruncateToMinute(AsUtcScheduleInstant(target));

    public static bool SameCalendarDay(DateTime a, DateTime b) =>
        AsUtcScheduleInstant(a).Date == AsUtcScheduleInstant(b).Date;

    public static EventAttendance PickPreferredAttendance(IEnumerable<EventAttendance> rows)
    {
        return rows
            .OrderByDescending(a => a.Status is AttendanceStatus.Added or AttendanceStatus.Accepted or AttendanceStatus.Declined)
            .ThenByDescending(a => a.Status != AttendanceStatus.Expected)
            .ThenByDescending(a => a.UpdatedAt ?? a.CreatedAt)
            .First();
    }
}
