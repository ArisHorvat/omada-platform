using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class OfferingTimetableService : IOfferingTimetableService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public OfferingTimetableService(
        ApplicationDbContext context,
        IUnitOfWork uow,
        IUserContext userContext)
    {
        _context = context;
        _uow = uow;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<PublishTimetableResultDto>> PublishTimetableAsync(
        Guid periodId,
        Guid offeringId,
        PublishTimetableRequest request,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;

        var offering = await _context.CourseOfferings
            .Include(o => o.Period)
            .FirstOrDefaultAsync(o =>
                o.Id == offeringId &&
                o.OrganizationId == orgId &&
                o.PeriodId == periodId &&
                !o.IsDeleted,
                cancellationToken);

        if (offering == null)
            return Fail(ErrorCodes.NotFound, "Offering not found.");

        var sessions = OfferingSessionPlanJson.Parse(offering.WeeklySessionPlanJson)
            .Where(s => s.EventTypeId.HasValue && s.Frequency != "as_needed")
            .ToList();

        if (sessions.Count == 0)
        {
            return Fail(ErrorCodes.InvalidInput,
                "Add at least one weekly session with an event type before publishing the timetable.");
        }

        var existingIds = ParseEventIds(offering.TimetablePublishedEventIdsJson);
        if (existingIds.Count > 0 && !request.ReplaceExisting)
        {
            return Fail(ErrorCodes.Conflict,
                "Timetable already published for this offering. Pass replaceExisting to republish.");
        }

        if (request.ReplaceExisting && existingIds.Count > 0)
        {
            var toRemove = await _context.Events
                .Where(e => existingIds.Contains(e.Id) && e.OrganizationId == orgId && !e.IsDeleted)
                .ToListAsync(cancellationToken);
            foreach (var ev in toRemove)
                ev.IsDeleted = true;
        }

        var periodEnd = offering.Period.EndDate.Date.AddDays(1).AddTicks(-1);
        var untilStr = periodEnd.ToUniversalTime().ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

        var createdIds = new List<Guid>();
        var typeNames = await LoadEventTypeNamesAsync(sessions, orgId, cancellationToken);

        foreach (var session in sessions)
        {
            if (!session.EventTypeId.HasValue)
                continue;

            var start = ComputeFirstOccurrence(
                offering.Period.StartDate,
                OfferingSessionPlanJson.NormalizeDayOfWeek(session.DayOfWeek),
                OfferingSessionPlanJson.NormalizeStartTimeLocal(session.StartTimeLocal));

            if (start > periodEnd)
                continue;

            var durationHours = (double)Math.Max(0.25m, session.HoursPerSession);
            var end = start.AddHours(durationHours);

            var freq = session.Frequency switch
            {
                "biweekly" => $"FREQ=WEEKLY;INTERVAL=2;UNTIL={untilStr}",
                "monthly" => $"FREQ=MONTHLY;INTERVAL=1;UNTIL={untilStr}",
                _ => $"FREQ=WEEKLY;INTERVAL=1;UNTIL={untilStr}"
            };

            typeNames.TryGetValue(session.EventTypeId.Value, out var typeName);
            var activityLabel = typeName ?? session.EventTypeName ?? "Session";

            var evt = new Event
            {
                OrganizationId = orgId,
                Title = $"{offering.Name} — {activityLabel}",
                Description = offering.Code,
                StartTime = DateTime.SpecifyKind(start, DateTimeKind.Utc),
                EndTime = DateTime.SpecifyKind(end, DateTimeKind.Utc),
                EventTypeId = session.EventTypeId.Value,
                HostId = offering.HostId,
                PeriodId = offering.PeriodId,
                OfferingId = offering.Id,
                RecurrenceRule = freq
            };

            await _uow.Repository<Event>().AddAsync(evt);
            createdIds.Add(evt.Id);
        }

        await _uow.CompleteAsync();

        offering.TimetablePublishedAt = DateTime.UtcNow;
        offering.TimetablePublishedEventIdsJson = JsonSerializer.Serialize(createdIds, JsonOptions);
        _context.CourseOfferings.Update(offering);
        await _context.SaveChangesAsync(cancellationToken);

        var seeded = await SeedExpectedAttendanceInternalAsync(offering, cancellationToken);

        return new ServiceResponse<PublishTimetableResultDto>(true, new PublishTimetableResultDto
        {
            EventsCreated = createdIds.Count,
            ExpectedAttendanceRowsSeeded = seeded,
            PublishedAt = offering.TimetablePublishedAt.Value
        });
    }

    public async Task<ServiceResponse<int>> SeedExpectedAttendanceAsync(
        Guid offeringId,
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var offering = await _context.CourseOfferings.AsNoTracking()
            .Include(o => o.Period)
            .FirstOrDefaultAsync(o => o.Id == offeringId && o.OrganizationId == orgId && !o.IsDeleted, cancellationToken);

        if (offering == null)
            return new ServiceResponse<int>(false, 0, new AppError(ErrorCodes.NotFound, "Offering not found."));

        var count = await SeedExpectedAttendanceInternalAsync(offering, cancellationToken);
        return new ServiceResponse<int>(true, count);
    }

    private async Task<int> SeedExpectedAttendanceInternalAsync(
        CourseOffering offering,
        CancellationToken cancellationToken)
    {
        var orgId = offering.OrganizationId;
        var periodStart = offering.Period.StartDate.Date;
        var periodEnd = offering.Period.EndDate.Date.AddDays(1);

        var eventIds = ParseEventIds(offering.TimetablePublishedEventIdsJson);
        if (eventIds.Count == 0)
        {
            eventIds = await _context.Events.AsNoTracking()
                .Where(e => e.OfferingId == offering.Id && e.OrganizationId == orgId && !e.IsDeleted)
                .Select(e => e.Id)
                .ToListAsync(cancellationToken);
        }

        if (eventIds.Count == 0)
            return 0;

        var events = await _context.Events.AsNoTracking()
            .Where(e => eventIds.Contains(e.Id) && !e.IsDeleted)
            .ToListAsync(cancellationToken);

        var enrollments = await _context.OfferingEnrollments.AsNoTracking()
            .Where(e => e.OfferingId == offering.Id && !e.IsDeleted)
            .ToListAsync(cancellationToken);

        if (enrollments.Count == 0 || events.Count == 0)
            return 0;

        var existing = await _context.Set<EventAttendance>()
            .Where(a => eventIds.Contains(a.EventId) && !a.IsDeleted)
            .Select(a => new { a.EventId, a.UserId, Day = a.InstanceDate.Date })
            .ToListAsync(cancellationToken);

        var existingKeys = existing
            .Select(x => (x.EventId, x.UserId, x.Day))
            .ToHashSet();

        var toAdd = new List<EventAttendance>();

        foreach (var evt in events)
        {
            foreach (var instanceStart in ExpandOccurrenceStarts(evt, periodStart, periodEnd))
            {
                foreach (var enrollment in enrollments)
                {
                    if (evt.CohortGroupId.HasValue && enrollment.CohortGroupId != evt.CohortGroupId)
                        continue;

                    var key = (evt.Id, enrollment.UserId, instanceStart.Date);
                    if (existingKeys.Contains(key))
                        continue;

                    existingKeys.Add(key);
                    toAdd.Add(new EventAttendance
                    {
                        EventId = evt.Id,
                        UserId = enrollment.UserId,
                        InstanceDate = instanceStart.Date,
                        Status = AttendanceStatus.Expected
                    });
                }
            }
        }

        if (toAdd.Count == 0)
            return 0;

        await _context.Set<EventAttendance>().AddRangeAsync(toAdd, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return toAdd.Count;
    }

    private static IEnumerable<DateTime> ExpandOccurrenceStarts(Event evt, DateTime rangeStart, DateTime rangeEnd)
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

    private static DateTime ComputeFirstOccurrence(DateTime periodStart, int dayOfWeek, string startTimeLocal)
    {
        var d = periodStart.Date;
        while ((int)d.DayOfWeek != dayOfWeek)
            d = d.AddDays(1);

        var parts = startTimeLocal.Split(':');
        var hour = int.Parse(parts[0]);
        var minute = int.Parse(parts[1]);
        return d.AddHours(hour).AddMinutes(minute);
    }

    private async Task<Dictionary<Guid, string>> LoadEventTypeNamesAsync(
        IReadOnlyList<OfferingWeeklySessionDto> sessions,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = sessions.Where(s => s.EventTypeId.HasValue).Select(s => s.EventTypeId!.Value).Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, string>();

        return await _context.EventTypes.AsNoTracking()
            .Where(t => ids.Contains(t.Id) && t.OrganizationId == orgId && !t.IsDeleted)
            .ToDictionaryAsync(t => t.Id, t => t.Name, cancellationToken);
    }

    private static List<Guid> ParseEventIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<Guid>();

        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(json, JsonOptions) ?? new List<Guid>();
        }
        catch (JsonException)
        {
            return new List<Guid>();
        }
    }

    private static ServiceResponse<PublishTimetableResultDto> Fail(string code, string message) =>
        new(false, null!, new AppError(code, message));
}
