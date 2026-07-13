namespace Omada.Api.Infrastructure;

/// <summary>
/// Converts admin-entered wall-clock times to UTC schedule instants (same convention as mobile CreateEventRequest + toISOString).
/// </summary>
public static class ScheduleWallClock
{
    /// <summary>
    /// JS <c>Date.getTimezoneOffset()</c>: minutes to add to local wall time to get UTC (UTC − local).
    /// </summary>
    public static DateTime ToUtcInstant(DateTime calendarDate, int hour, int minute, int clientUtcOffsetMinutes)
    {
        var localTotalMinutes = hour * 60 + minute;
        var utcTotalMinutes = localTotalMinutes + clientUtcOffsetMinutes;

        var date = calendarDate.Date;
        while (utcTotalMinutes < 0)
        {
            utcTotalMinutes += 24 * 60;
            date = date.AddDays(-1);
        }

        while (utcTotalMinutes >= 24 * 60)
        {
            utcTotalMinutes -= 24 * 60;
            date = date.AddDays(1);
        }

        var utcHour = utcTotalMinutes / 60;
        var utcMinute = utcTotalMinutes % 60;
        return new DateTime(date.Year, date.Month, date.Day, utcHour, utcMinute, 0, DateTimeKind.Utc);
    }

    public static DateTime EndOfCalendarDayUtc(DateTime calendarDate, int clientUtcOffsetMinutes) =>
        ToUtcInstant(calendarDate, 23, 59, clientUtcOffsetMinutes).AddSeconds(59);
}
