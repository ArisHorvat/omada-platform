using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Attendance;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class AttendanceService : IAttendanceService
{
    private const int DefaultHistoryDays = 60;
    private const int MaxRecords = 50;

    /// <summary>Teacher roll list: Monday 00:00 UTC through end of that calendar week.</summary>
    private static DateTime TeacherWeekStartUtc(DateTime utcNow) => StartOfWeekMondayUtc(utcNow.Date);

    private static DateTime StartOfWeekMondayUtc(DateTime date)
    {
        var d = date.Date;
        var diff = (7 + (int)d.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        return d.AddDays(-diff);
    }

    private readonly IAttendanceRepository _attendanceRepository;
    private readonly IUserContext _userContext;
    private readonly IGroupService _groupService;
    private readonly IScheduleService _scheduleService;
    private readonly ApplicationDbContext _db;
    private readonly IGroupScopeService _groupScope;

    public AttendanceService(
        IAttendanceRepository attendanceRepository,
        IUserContext userContext,
        IGroupService groupService,
        IScheduleService scheduleService,
        ApplicationDbContext db,
        IGroupScopeService groupScope)
    {
        _attendanceRepository = attendanceRepository;
        _userContext = userContext;
        _groupService = groupService;
        _scheduleService = scheduleService;
        _db = db;
        _groupScope = groupScope;
    }

    public async Task<ServiceResponse<MyAttendanceResponse>> GetMyAttendanceAsync(
        Guid? groupId = null,
        int? days = null,
        CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var organizationId = _userContext.OrganizationId;

        var orgKind = await _groupService.GetOrganizationKindAsync(organizationId, cancellationToken);
        var configResponse = await _groupService.GetAttendanceConfigAsync();
        var mode = configResponse.IsSuccess && configResponse.Data != null
            ? configResponse.Data.Mode
            : "Student";

        var lookbackDays = days is > 0 and <= 365 ? days.Value : DefaultHistoryDays;
        var fromUtc = DateTime.UtcNow.Date.AddDays(-lookbackDays);
        var toUtc = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

        var rows = await _attendanceRepository.GetUserRecordsAsync(
            organizationId, userId, groupId, fromUtc, toUtc, MaxRecords, cancellationToken);

        var deduped = rows
            .GroupBy(r => (r.EventId, AttendanceInstanceHelper.AsUtcScheduleInstant(r.InstanceDate).Date))
            .Select(g => AttendanceInstanceHelper.PickPreferredAttendance(g))
            .OrderByDescending(r => r.InstanceDate)
            .ToList();

        var records = deduped.Select(r => MapRecord(r, orgKind)).ToList();
        var summary = BuildSummary(deduped, orgKind);

        AttendanceSessionDto? nextSession = null;
        IReadOnlyList<AttendanceSessionDto> teacherSessions = Array.Empty<AttendanceSessionDto>();

        try
        {
            nextSession = await ResolveNextSessionAsync(userId, organizationId, cancellationToken);

            var skipTeacherSessions = string.Equals(orgKind, "University", StringComparison.OrdinalIgnoreCase)
                && string.Equals(mode, "Student", StringComparison.OrdinalIgnoreCase);

            if (!skipTeacherSessions)
            {
                teacherSessions = await ResolveTeacherSessionsAsync(
                    userId, organizationId, orgKind, configResponse.Data, cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Client aborted — return history/summary already loaded.
        }

        return new ServiceResponse<MyAttendanceResponse>(true, new MyAttendanceResponse
        {
            Summary = summary,
            Records = records,
            Mode = mode,
            OrganizationKind = orgKind,
            NextSession = nextSession,
            TeacherSessions = teacherSessions
        });
    }

    private static AttendanceSummaryDto BuildSummary(IReadOnlyList<EventAttendance> rows, string orgKind)
    {
        var isCorporate = string.Equals(orgKind, "Corporate", StringComparison.OrdinalIgnoreCase);
        var present = rows.Count(r => IsPresent(r.Status, isCorporate));
        var absent = rows.Count(r => IsAbsent(r.Status));
        var tentative = rows.Count(r => r.Status == AttendanceStatus.Tentative);
        var tracked = present + absent;
        var rate = tracked == 0 ? 0 : Math.Round((decimal)present / tracked * 100m, 1);

        return new AttendanceSummaryDto
        {
            PresentCount = present,
            AbsentCount = absent,
            TentativeCount = tentative,
            TotalTracked = tracked,
            RatePercent = rate,
            PresentStreakDays = CalculatePresentStreak(rows, isCorporate)
        };
    }

    private static AttendanceRecordDto MapRecord(EventAttendance row, string orgKind)
    {
        var isCorporate = string.Equals(orgKind, "Corporate", StringComparison.OrdinalIgnoreCase);
        return new AttendanceRecordDto
        {
            Id = row.Id,
            EventId = row.EventId,
            EventTitle = row.Event.Title,
            GroupId = row.Event.GroupId ?? row.Event.CohortGroupId,
            GroupName = row.Event.Group?.Name ?? row.Event.CohortGroup?.Name,
            EventTypeName = row.Event.EventType?.Name,
            RoomName = row.Event.Room?.Name,
            InstanceDate = row.InstanceDate,
            Status = row.Status,
            StatusLabel = StatusLabel(row.Status, isCorporate)
        };
    }

    private async Task<AttendanceSessionDto?> ResolveNextSessionAsync(
        Guid userId,
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var from = DateTime.UtcNow.Date;
        var to = from.AddDays(2);
        var visibility = await LoadScheduleVisibilityAsync(organizationId, userId, cancellationToken);
        var linkedEventIds = await LoadAttendanceLinkedEventIdsAsync(userId, cancellationToken);

        var events = await QueryLightweightEventsAsync(
            organizationId, from, to, hostId: null, groupScopeIds: null, cancellationToken);

        var occurrences = await ExpandEventOccurrencesAsync(
            events, from, to, userId, requireEndAfterNow: true, cancellationToken);

        var enrollmentsByOffering = await LoadEnrollmentsByOfferingAsync(
            occurrences.Select(o => o.Event).Where(e => e.OfferingId.HasValue).Select(e => e.OfferingId!.Value),
            organizationId,
            cancellationToken);

        var upcoming = occurrences
            .Where(o => IsVisibleForAttendance(o.Event, visibility, linkedEventIds))
            .OrderBy(o => o.Start)
            .FirstOrDefault();

        if (upcoming.Event is null)
            return null;

        return MapEventToSession(upcoming.Event, upcoming.Start, upcoming.End, enrollmentsByOffering);
    }

    private async Task<IReadOnlyList<AttendanceSessionDto>> ResolveTeacherSessionsAsync(
        Guid userId,
        Guid organizationId,
        string orgKind,
        DTOs.Groups.AttendanceConfigDto? config,
        CancellationToken cancellationToken)
    {
        if (config == null)
            return Array.Empty<AttendanceSessionDto>();

        var from = TeacherWeekStartUtc(DateTime.UtcNow);
        var to = from.AddDays(7);
        var isUniversity = string.Equals(orgKind, "University", StringComparison.OrdinalIgnoreCase);

        Guid? hostId = null;
        HashSet<Guid>? groupScopeIds = null;

        if (isUniversity)
        {
            hostId = userId;
        }
        else
        {
            switch (config.Mode)
            {
                case "SessionManager":
                    groupScopeIds = new HashSet<Guid>();
                    foreach (var group in config.Groups)
                    {
                        var scope = await _groupScope.GetDescendantIdsAsync(organizationId, group.Id, includeSelf: true);
                        foreach (var id in scope)
                            groupScopeIds.Add(id);
                    }
                    break;
                case "Approval" when config.Department != null:
                    groupScopeIds = await _groupScope.GetDescendantIdsAsync(
                        organizationId, config.Department.Id, includeSelf: true);
                    break;
                case "UniversalSessionManager":
                    break;
                default:
                    hostId = userId;
                    break;
            }
        }

        var events = await QueryLightweightEventsAsync(
            organizationId, from, to, hostId, groupScopeIds, cancellationToken);

        var occurrences = await ExpandEventOccurrencesAsync(
            events, from, to, userIdForDeclined: null, requireEndAfterNow: true, cancellationToken);

        var enrollmentsByOffering = await LoadEnrollmentsByOfferingAsync(
            occurrences.Select(o => o.Event).Where(e => e.OfferingId.HasValue).Select(e => e.OfferingId!.Value),
            organizationId,
            cancellationToken);

        var seen = new HashSet<(Guid EventId, DateTime Day)>();
        var sessions = new List<AttendanceSessionDto>();

        foreach (var occurrence in occurrences.OrderBy(o => o.Start))
        {
            if (isUniversity && occurrence.Event.HostId != userId)
                continue;

            if (!seen.Add((occurrence.Event.Id, occurrence.Start.Date)))
                continue;

            sessions.Add(MapEventToSession(
                occurrence.Event, occurrence.Start, occurrence.End, enrollmentsByOffering));
        }

        return sessions.Take(30).ToList();
    }

    private IQueryable<Event> BuildLightweightEventQuery(Guid orgId) =>
        _db.Events.AsNoTracking()
            .AsSplitQuery()
            .Include(e => e.EventType)
            .Include(e => e.Room)
            .Include(e => e.Group)
            .Include(e => e.Offering)
            .Include(e => e.CohortGroup)
            .Include(e => e.Overrides)
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted);

    private async Task<List<Event>> QueryLightweightEventsAsync(
        Guid orgId,
        DateTime from,
        DateTime to,
        Guid? hostId,
        IReadOnlyCollection<Guid>? groupScopeIds,
        CancellationToken cancellationToken)
    {
        var query = BuildLightweightEventQuery(orgId)
            .Where(e =>
                (e.StartTime < to && e.EndTime > from) ||
                (e.RecurrenceRule != null && e.StartTime < to));

        if (hostId.HasValue)
            query = query.Where(e => e.HostId == hostId);

        if (groupScopeIds is { Count: > 0 })
        {
            query = query.Where(e =>
                (e.GroupId.HasValue && groupScopeIds.Contains(e.GroupId.Value)) ||
                (e.CohortGroupId.HasValue && groupScopeIds.Contains(e.CohortGroupId.Value)));
        }

        return await query.ToListAsync(cancellationToken);
    }

    private async Task<List<(Event Event, DateTime Start, DateTime End)>> ExpandEventOccurrencesAsync(
        IReadOnlyList<Event> events,
        DateTime from,
        DateTime to,
        Guid? userIdForDeclined,
        bool requireEndAfterNow,
        CancellationToken cancellationToken)
    {
        if (events.Count == 0)
            return new List<(Event, DateTime, DateTime)>();

        var declined = new HashSet<(Guid EventId, DateTime Minute)>();
        if (userIdForDeclined.HasValue)
        {
            var eventIds = events.Select(e => e.Id).ToList();
            var declinedRows = await _db.Set<EventAttendance>().AsNoTracking()
                .Where(a =>
                    a.UserId == userIdForDeclined.Value &&
                    !a.IsDeleted &&
                    a.Status == AttendanceStatus.Declined &&
                    eventIds.Contains(a.EventId))
                .Select(a => new { a.EventId, a.InstanceDate })
                .ToListAsync(cancellationToken);

            foreach (var row in declinedRows)
                declined.Add((row.EventId, AttendanceInstanceHelper.TruncateToMinute(row.InstanceDate)));
        }

        var now = DateTime.UtcNow;
        var result = new List<(Event, DateTime, DateTime)>();

        foreach (var e in events)
        {
            if (string.IsNullOrEmpty(e.RecurrenceRule))
            {
                var start = AttendanceInstanceHelper.AsUtcScheduleInstant(e.StartTime);
                var end = AttendanceInstanceHelper.AsUtcScheduleInstant(e.EndTime);
                if (start >= to || end <= from)
                    continue;
                if (requireEndAfterNow && end <= now)
                    continue;
                if (e.Overrides.Any(o => o.OriginalStartTime == e.StartTime && o.IsCancelled))
                    continue;
                if (declined.Contains((e.Id, AttendanceInstanceHelper.TruncateToMinute(start))))
                    continue;

                result.Add((e, start, end));
                continue;
            }

            foreach (var (start, end) in ExpandRecurringOccurrences(e, from, to))
            {
                if (requireEndAfterNow && end <= now)
                    continue;
                if (declined.Contains((e.Id, AttendanceInstanceHelper.TruncateToMinute(start))))
                    continue;

                result.Add((e, start, end));
            }
        }

        return result;
    }

    private static IEnumerable<(DateTime Start, DateTime End)> ExpandRecurringOccurrences(
        Event e,
        DateTime rangeStart,
        DateTime rangeEnd)
    {
        var rule = e.RecurrenceRule ?? string.Empty;
        var interval = 1;
        var intervalMatch = System.Text.RegularExpressions.Regex.Match(rule, "INTERVAL=(\\d+)");
        if (intervalMatch.Success)
            interval = int.Parse(intervalMatch.Groups[1].Value);

        var isDaily = rule.Contains("FREQ=DAILY", StringComparison.Ordinal);
        var isWeekly = rule.Contains("FREQ=WEEKLY", StringComparison.Ordinal);
        var isMonthly = rule.Contains("FREQ=MONTHLY", StringComparison.Ordinal);
        var isYearly = rule.Contains("FREQ=YEARLY", StringComparison.Ordinal);
        if (!isDaily && !isWeekly && !isMonthly && !isYearly)
            yield break;

        DateTime? untilDate = null;
        var untilMatch = System.Text.RegularExpressions.Regex.Match(rule, "UNTIL=(\\d{8}T\\d{6}Z)");
        if (untilMatch.Success &&
            DateTime.TryParseExact(
                untilMatch.Groups[1].Value,
                "yyyyMMddTHHmmssZ",
                null,
                System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var parsedUntil))
        {
            untilDate = parsedUntil;
        }

        var duration = e.EndTime - e.StartTime;
        var currentStart = AttendanceInstanceHelper.AsUtcScheduleInstant(e.StartTime);
        var currentEnd = currentStart.Add(duration);

        while (currentEnd < rangeStart)
        {
            currentStart = StepRecurrence(currentStart, isDaily, isWeekly, isMonthly, isYearly, interval);
            currentEnd = currentStart.Add(duration);
            if (currentStart > rangeEnd.AddYears(1))
                yield break;
        }

        while (currentStart < rangeEnd)
        {
            if (untilDate.HasValue && currentStart > untilDate.Value)
                yield break;

            var isCancelled = e.Overrides.Any(o =>
                AttendanceInstanceHelper.InstanceMatches(o.OriginalStartTime, currentStart) && o.IsCancelled);
            if (!isCancelled)
                yield return (currentStart, currentEnd);

            currentStart = StepRecurrence(currentStart, isDaily, isWeekly, isMonthly, isYearly, interval);
            currentEnd = currentStart.Add(duration);
        }
    }

    private static DateTime StepRecurrence(
        DateTime currentStart,
        bool isDaily,
        bool isWeekly,
        bool isMonthly,
        bool isYearly,
        int interval)
    {
        if (isDaily) return currentStart.AddDays(interval);
        if (isWeekly) return currentStart.AddDays(7 * interval);
        if (isMonthly) return currentStart.AddMonths(interval);
        if (isYearly) return currentStart.AddYears(interval);
        return currentStart;
    }

    private async Task<ScheduleUserVisibilityContext> LoadScheduleVisibilityAsync(
        Guid orgId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var userGroupIds = await _groupScope.GetUserEffectiveGroupIdsAsync(orgId, userId);

        var enrollments = await _db.OfferingEnrollments.AsNoTracking()
            .Where(e => e.UserId == userId && e.OrganizationId == orgId && !e.IsDeleted)
            .Select(e => new { e.OfferingId, e.CohortGroupId })
            .ToListAsync(cancellationToken);

        var enrolledOfferingIds = enrollments.Select(e => e.OfferingId).ToHashSet();
        var enrollmentCohortsByOffering = enrollments
            .Where(e => e.CohortGroupId.HasValue)
            .GroupBy(e => e.OfferingId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.CohortGroupId!.Value).ToHashSet());

        var teachingOfferingIds = (await _db.OfferingInstructors.AsNoTracking()
            .Where(i => i.UserId == userId && i.OrganizationId == orgId && !i.IsDeleted)
            .Select(i => i.OfferingId)
            .ToListAsync(cancellationToken)).ToHashSet();

        return new ScheduleUserVisibilityContext
        {
            UserId = userId,
            UserGroupIds = userGroupIds,
            EnrolledOfferingIds = enrolledOfferingIds,
            EnrollmentCohortIdsByOffering = enrollmentCohortsByOffering,
            TeachingOfferingIds = teachingOfferingIds
        };
    }

    private async Task<HashSet<Guid>> LoadAttendanceLinkedEventIdsAsync(
        Guid userId,
        CancellationToken cancellationToken) =>
        (await _db.Set<EventAttendance>().AsNoTracking()
            .Where(a =>
                a.UserId == userId &&
                !a.IsDeleted &&
                (a.Status == AttendanceStatus.Added || a.Status == AttendanceStatus.Expected))
            .Select(a => a.EventId)
            .Distinct()
            .ToListAsync(cancellationToken)).ToHashSet();

    private static bool IsVisibleForAttendance(
        Event evt,
        ScheduleUserVisibilityContext visibility,
        HashSet<Guid> linkedEventIds)
    {
        if (evt.HostId == visibility.UserId)
            return true;

        if (evt.OfferingId.HasValue && visibility.TeachingOfferingIds.Contains(evt.OfferingId.Value))
            return true;

        if (evt.GroupId.HasValue && visibility.UserGroupIds.Contains(evt.GroupId.Value))
            return true;

        if (evt.CohortGroupId.HasValue && visibility.UserGroupIds.Contains(evt.CohortGroupId.Value))
            return true;

        if (evt.OfferingId.HasValue && visibility.EnrolledOfferingIds.Contains(evt.OfferingId.Value))
        {
            var enrollmentCohorts = visibility.EnrollmentCohortsForOffering(evt.OfferingId);
            if (EventAudienceHelper.UserGroupSeesOfferingEvent(
                    evt, visibility.UserGroupIds, visibility.EnrolledOfferingIds, enrollmentCohorts))
                return true;
        }

        return linkedEventIds.Contains(evt.Id);
    }

    private async Task<Dictionary<Guid, List<OfferingEnrollment>>> LoadEnrollmentsByOfferingAsync(
        IEnumerable<Guid> offeringIds,
        Guid orgId,
        CancellationToken cancellationToken)
    {
        var ids = offeringIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, List<OfferingEnrollment>>();

        var rows = await _db.OfferingEnrollments.AsNoTracking()
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted && ids.Contains(e.OfferingId))
            .ToListAsync(cancellationToken);

        return rows.GroupBy(e => e.OfferingId).ToDictionary(g => g.Key, g => g.ToList());
    }

    private static int CountEnrolledForEvent(
        Event e,
        IReadOnlyDictionary<Guid, List<OfferingEnrollment>> enrollmentsByOffering)
    {
        if (!e.OfferingId.HasValue ||
            !enrollmentsByOffering.TryGetValue(e.OfferingId.Value, out var enrollments))
            return 0;

        return enrollments.Count(enrollment => EventAudienceHelper.EnrollmentMatchesEvent(enrollment, e));
    }

    private static AttendanceSessionDto MapEventToSession(
        Event e,
        DateTime start,
        DateTime end,
        IReadOnlyDictionary<Guid, List<OfferingEnrollment>> enrollmentsByOffering) =>
        new()
        {
            EventId = e.Id,
            Title = e.Title,
            GroupId = e.GroupId,
            GroupName = e.Group?.Name,
            CohortGroupName = e.CohortGroup?.Name,
            RoomName = e.Room?.Name,
            StartTime = start,
            EndTime = end,
            EnrolledCount = CountEnrolledForEvent(e, enrollmentsByOffering),
            MaxCapacity = e.MaxCapacity,
            OfferingId = e.OfferingId,
            OfferingName = e.Offering?.Name,
            EventTypeName = e.EventType?.Name,
            InstanceDate = start
        };

    private static bool IsPresent(AttendanceStatus status, bool isCorporate)
    {
        if (status == AttendanceStatus.Declined || status == AttendanceStatus.None)
            return false;
        if (status == AttendanceStatus.Tentative || status == AttendanceStatus.Expected)
            return false;
        if (isCorporate)
            return status is AttendanceStatus.Accepted or AttendanceStatus.Added;
        return status is AttendanceStatus.Added or AttendanceStatus.Accepted;
    }

    private static bool IsAbsent(AttendanceStatus status) => status == AttendanceStatus.Declined;

    private static string StatusLabel(AttendanceStatus status, bool isCorporate)
    {
        if (isCorporate)
        {
            return status switch
            {
                AttendanceStatus.Accepted => "Accepted",
                AttendanceStatus.Tentative => "Maybe",
                AttendanceStatus.Declined => "Declined",
                AttendanceStatus.Added => "Joined",
                AttendanceStatus.Expected => "Expected",
                _ => status.ToString()
            };
        }

        return status switch
        {
            AttendanceStatus.Declined => "Absent",
            AttendanceStatus.Added or AttendanceStatus.Accepted => "Present",
            AttendanceStatus.Expected => "Not marked",
            AttendanceStatus.Tentative => "Tentative",
            AttendanceStatus.None => "Not marked",
            _ => status.ToString()
        };
    }

    private static int CalculatePresentStreak(IReadOnlyList<EventAttendance> rows, bool isCorporate)
    {
        var presentDays = rows
            .Where(r => IsPresent(r.Status, isCorporate))
            .Select(r => r.InstanceDate.Date)
            .Distinct()
            .ToHashSet();

        if (presentDays.Count == 0)
            return 0;

        var cursor = DateTime.UtcNow.Date;
        if (!presentDays.Contains(cursor))
            cursor = cursor.AddDays(-1);

        var streak = 0;
        while (presentDays.Contains(cursor))
        {
            streak++;
            cursor = cursor.AddDays(-1);
        }

        return streak;
    }

    public async Task<ServiceResponse<PagedResponse<AttendanceAdminRecordDto>>> GetAdminRecordsAsync(
        PagedRequest request,
        Guid? userId,
        Guid? groupId,
        int? days,
        CancellationToken cancellationToken = default)
    {
        var organizationId = _userContext.OrganizationId;
        var lookbackDays = days is > 0 and <= 365 ? days.Value : DefaultHistoryDays;
        var fromUtc = DateTime.UtcNow.Date.AddDays(-lookbackDays);
        var toUtc = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

        var paged = await _attendanceRepository.GetOrgRecordsPagedAsync(
            organizationId,
            request.Page,
            request.PageSize,
            userId,
            groupId,
            fromUtc,
            toUtc,
            cancellationToken);

        return new ServiceResponse<PagedResponse<AttendanceAdminRecordDto>>(true, new PagedResponse<AttendanceAdminRecordDto>
        {
            Items = paged.Items.Select(MapAdminRecord).ToList(),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        });
    }

    public async Task<ServiceResponse<bool>> RecordMemberAttendanceAsync(
        RecordMemberAttendanceRequest request,
        CancellationToken cancellationToken = default)
    {
        var actorId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        if (!await ActorCanRecordMemberAttendanceAsync(actorId, orgId, cancellationToken))
        {
            return new ServiceResponse<bool>(false, false,
                new AppError(ErrorCodes.Forbidden, "You do not have permission to record attendance for others."));
        }

        var targetActive = await _db.OrganizationMembers.AsNoTracking()
            .AnyAsync(m => m.UserId == request.UserId && m.OrganizationId == orgId && m.IsActive, cancellationToken);
        if (!targetActive)
        {
            return new ServiceResponse<bool>(false, false,
                new AppError(ErrorCodes.NotFound, "Member not found or inactive in this organization."));
        }

        var evt = await _db.Events.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.EventId && e.OrganizationId == orgId && !e.IsDeleted, cancellationToken);
        if (evt == null)
        {
            return new ServiceResponse<bool>(false, false,
                new AppError(ErrorCodes.NotFound, "Session not found."));
        }

        if (!await CanActorRecordAttendanceForEventAsync(actorId, evt, cancellationToken))
        {
            return new ServiceResponse<bool>(false, false,
                new AppError(ErrorCodes.Forbidden, "You cannot record attendance for this session."));
        }

        var update = new UpdateAttendanceRequest
        {
            InstanceDate = request.InstanceDate,
            Status = request.Status,
        };

        return await _scheduleService.ApplyAttendanceForUserAsync(request.EventId, request.UserId, update);
    }

    private async Task<bool> ActorCanRecordMemberAttendanceAsync(Guid actorId, Guid orgId, CancellationToken cancellationToken)
    {
        var member = await _db.OrganizationMembers.AsNoTracking()
            .Include(m => m.Role!)
                .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(m => m.UserId == actorId && m.OrganizationId == orgId && m.IsActive, cancellationToken);

        if (member?.Role == null)
            return false;

        if (string.Equals(member.Role.Name, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
            return true;

        return member.Role.Permissions.Any(p =>
            p.WidgetKey == WidgetKeys.Attendance && p.AccessLevel >= AccessLevel.Edit);
    }

    private async Task<bool> CanActorRecordAttendanceForEventAsync(Guid actorId, Event evt, CancellationToken cancellationToken)
    {
        if (evt.HostId == actorId)
            return true;

        var orgId = _userContext.OrganizationId;
        var orgKind = await _groupService.GetOrganizationKindAsync(orgId, cancellationToken);
        var isUniversity = string.Equals(orgKind, "University", StringComparison.OrdinalIgnoreCase);

        if (!isUniversity && evt.OfferingId.HasValue)
        {
            if (await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                    _db, orgId, actorId, evt.OfferingId.Value))
                return true;
        }

        var configResponse = await _groupService.GetAttendanceConfigAsync();
        if (!configResponse.IsSuccess || configResponse.Data == null)
            return false;

        var config = configResponse.Data;
        return config.Mode switch
        {
            "SessionManager" => evt.GroupId.HasValue && config.Groups.Any(g => g.Id == evt.GroupId.Value),
            "UniversalSessionManager" => true,
            "Approval" => config.Department != null && evt.GroupId == config.Department.Id,
            _ => false,
        };
    }

    private static AttendanceAdminRecordDto MapAdminRecord(EventAttendance row) => new()
    {
        Id = row.Id,
        UserId = row.UserId,
        StudentName = $"{row.User.FirstName} {row.User.LastName}".Trim(),
        EventId = row.EventId,
        EventTitle = row.Event.Title,
        GroupName = row.Event.Group?.Name,
        InstanceDate = row.InstanceDate,
        Status = row.Status
    };

    public async Task<ServiceResponse<AttendanceSessionRosterDto>> GetSessionRosterAsync(
        Guid eventId,
        DateTime instanceDate,
        CancellationToken cancellationToken = default)
    {
        var actorId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;
        var orgKind = await _groupService.GetOrganizationKindAsync(orgId, cancellationToken);
        var isCorporate = string.Equals(orgKind, "Corporate", StringComparison.OrdinalIgnoreCase);

        var evt = await _db.Events.AsNoTracking()
            .Include(e => e.EventType)
            .Include(e => e.Offering)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OrganizationId == orgId && !e.IsDeleted, cancellationToken);
        if (evt == null)
            return new ServiceResponse<AttendanceSessionRosterDto>(false, null!,
                new AppError(ErrorCodes.NotFound, "Session not found."));

        if (!await CanActorRecordAttendanceForEventAsync(actorId, evt, cancellationToken))
            return new ServiceResponse<AttendanceSessionRosterDto>(false, null!,
                new AppError(ErrorCodes.Forbidden, "You cannot view the roster for this session."));

        var canonicalInstance = AttendanceInstanceHelper.ResolveOccurrenceInstance(evt, instanceDate);
        var duration = evt.EndTime - evt.StartTime;
        var occurrenceEnd = canonicalInstance.Add(duration);

        var attendanceRows = await _db.Set<EventAttendance>().AsNoTracking()
            .Where(a => a.EventId == eventId && !a.IsDeleted)
            .ToListAsync(cancellationToken);

        var attendances = attendanceRows
            .Where(a => AttendanceInstanceHelper.SameCalendarDay(a.InstanceDate, canonicalInstance))
            .GroupBy(a => a.UserId)
            .ToDictionary(g => g.Key, g => AttendanceInstanceHelper.PickPreferredAttendance(g));

        var members = await ResolveRosterMembersForInstanceAsync(evt, canonicalInstance, attendances, cancellationToken);
        var rows = members.Select(m =>
        {
            attendances.TryGetValue(m.UserId, out var att);
            var status = RosterDisplayStatus(att?.Status);
            return new AttendanceRosterMemberDto
            {
                UserId = m.UserId,
                DisplayName = m.DisplayName,
                CohortGroupName = m.CohortGroupName,
                Status = status,
                StatusLabel = StatusLabel(status, isCorporate)
            };
        }).ToList();

        return new ServiceResponse<AttendanceSessionRosterDto>(true, new AttendanceSessionRosterDto
        {
            EventId = evt.Id,
            Title = evt.Title,
            OfferingId = evt.OfferingId,
            OfferingName = evt.Offering?.Name,
            EventTypeName = evt.EventType?.Name,
            InstanceDate = canonicalInstance,
            StartTime = canonicalInstance,
            EndTime = occurrenceEnd,
            Members = rows
        });
    }

    public async Task<ServiceResponse<bool>> BulkMarkSessionRosterAsync(
        Guid eventId,
        BulkMarkAttendanceRequest request,
        CancellationToken cancellationToken = default)
    {
        var actorId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        if (!await ActorCanRecordMemberAttendanceAsync(actorId, orgId, cancellationToken))
        {
            return new ServiceResponse<bool>(false, false,
                new AppError(ErrorCodes.Forbidden, "You do not have permission to record attendance for others."));
        }

        var evt = await _db.Events.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OrganizationId == orgId && !e.IsDeleted, cancellationToken);
        if (evt == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Session not found."));

        if (!await CanActorRecordAttendanceForEventAsync(actorId, evt, cancellationToken))
            return new ServiceResponse<bool>(false, false,
                new AppError(ErrorCodes.Forbidden, "You cannot record attendance for this session."));

        var canonicalInstance = AttendanceInstanceHelper.ResolveOccurrenceInstance(evt, request.InstanceDate);

        foreach (var row in request.Rows)
        {
            if (row.Status == AttendanceStatus.None)
            {
                var cleared = await ClearAttendanceForUserAsync(
                    eventId,
                    row.UserId,
                    canonicalInstance,
                    cancellationToken);
                if (!cleared.IsSuccess)
                    return cleared;
                continue;
            }

            var update = new UpdateAttendanceRequest
            {
                InstanceDate = canonicalInstance,
                Status = row.Status
            };
            var result = await _scheduleService.ApplyAttendanceForUserAsync(eventId, row.UserId, update);
            if (!result.IsSuccess)
                return result;
        }

        return new ServiceResponse<bool>(true, true);
    }

    private async Task<ServiceResponse<bool>> ClearAttendanceForUserAsync(
        Guid eventId,
        Guid userId,
        DateTime instanceDate,
        CancellationToken cancellationToken)
    {
        var canonicalInstance = AttendanceInstanceHelper.TruncateToMinute(
            AttendanceInstanceHelper.AsUtcScheduleInstant(instanceDate));
        var rows = await _db.Set<EventAttendance>()
            .Where(a => a.EventId == eventId && a.UserId == userId && !a.IsDeleted)
            .ToListAsync(cancellationToken);

        var matches = rows
            .Where(a =>
                AttendanceInstanceHelper.InstanceMatches(a.InstanceDate, canonicalInstance)
                || AttendanceInstanceHelper.SameCalendarDay(a.InstanceDate, canonicalInstance))
            .ToList();

        if (matches.Count == 0)
            return new ServiceResponse<bool>(true, true);

        foreach (var existing in matches)
        {
            existing.IsDeleted = true;
            existing.UpdatedAt = DateTime.UtcNow;
            _db.Set<EventAttendance>().Update(existing);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new ServiceResponse<bool>(true, true);
    }

    private static bool AttendanceInstanceMatches(DateTime stored, DateTime target) =>
        AttendanceInstanceHelper.InstanceMatches(stored, target);

    private static DateTime TruncateToMinute(DateTime value) =>
        AttendanceInstanceHelper.TruncateToMinute(value);

    public async Task<ServiceResponse<MyOfferingAttendanceResponse>> GetMyOfferingAttendanceAsync(
        Guid? periodId,
        CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var enrollmentsQuery = _db.OfferingEnrollments.AsNoTracking()
            .Include(e => e.Offering!)
                .ThenInclude(o => o.Period)
            .Where(e => e.UserId == userId && e.OrganizationId == orgId && !e.IsDeleted);

        if (periodId.HasValue)
            enrollmentsQuery = enrollmentsQuery.Where(e => e.Offering!.PeriodId == periodId.Value);

        var enrollments = await enrollmentsQuery.ToListAsync(cancellationToken);
        if (enrollments.Count == 0)
        {
            return new ServiceResponse<MyOfferingAttendanceResponse>(true, new MyOfferingAttendanceResponse
            {
                PeriodId = periodId,
                Offerings = Array.Empty<OfferingAttendanceSummaryDto>()
            });
        }

        var offeringIds = enrollments.Select(e => e.OfferingId).Distinct().ToList();
        var now = DateTime.UtcNow;

        var events = await _db.Events.AsNoTracking()
            .Include(e => e.EventType)
            .Where(e =>
                e.OrganizationId == orgId &&
                !e.IsDeleted &&
                e.OfferingId.HasValue &&
                offeringIds.Contains(e.OfferingId.Value))
            .ToListAsync(cancellationToken);

        var eventIds = events.Select(e => e.Id).ToList();
        var attendanceRows = eventIds.Count == 0
            ? new List<EventAttendance>()
            : await _db.Set<EventAttendance>().AsNoTracking()
                .Where(a =>
                    a.UserId == userId &&
                    !a.IsDeleted &&
                    eventIds.Contains(a.EventId))
                .ToListAsync(cancellationToken);

        var summaries = new List<OfferingAttendanceSummaryDto>();
        foreach (var enrollment in enrollments.GroupBy(e => e.OfferingId).Select(g => g.First()))
        {
            var offering = enrollment.Offering!;
            var period = offering.Period;
            var periodStart = period?.StartDate.Date ?? now.Date.AddMonths(-6);
            var periodEnd = period?.EndDate.Date.AddDays(1) ?? now.Date.AddDays(1);
            var rangeEnd = now < periodEnd ? now : periodEnd;

            var offeringEvents = events
                .Where(ev => ev.OfferingId == offering.Id &&
                             EventAudienceHelper.EnrollmentMatchesEvent(
                                 new OfferingEnrollment { CohortGroupId = enrollment.CohortGroupId },
                                 ev))
                .ToList();

            var heldKeys = new HashSet<(Guid Id, DateTime Instance)>();
            foreach (var ev in offeringEvents)
            {
                foreach (var key in EventOccurrenceExpander.CollectHeldInstances(ev, periodStart, rangeEnd, now))
                    heldKeys.Add((key.EventId, key.InstanceDate));
            }

            var relevantAttendance = attendanceRows
                .Where(a => offeringEvents.Any(ev => ev.Id == a.EventId))
                .ToList();

            var present = CountPresentSessions(relevantAttendance, heldKeys, offeringEvents);
            var held = heldKeys.Count;
            var rate = held == 0 ? 0 : Math.Round((decimal)present / held * 100m, 1);

            var required = offering.RequiredAttendancePercent;
            bool? meets = required.HasValue ? rate >= required.Value : null;

            var activityRequirements = OfferingSessionPlanJson.Parse(offering.WeeklySessionPlanJson)
                .Where(s => s.EventTypeId.HasValue && s.RequiredAttendancePercent.HasValue)
                .GroupBy(s => s.EventTypeId!.Value)
                .ToDictionary(g => g.Key, g => g.First().RequiredAttendancePercent);

            var activities = offeringEvents
                .GroupBy(ev => new { ev.EventTypeId, Name = ev.EventType?.Name ?? "Session" })
                .Select(g =>
                {
                    var typeHeld = new HashSet<(Guid Id, DateTime Instance)>();
                    foreach (var ev in g)
                    {
                        foreach (var key in EventOccurrenceExpander.CollectHeldInstances(ev, periodStart, rangeEnd, now))
                            typeHeld.Add((key.EventId, key.InstanceDate));
                    }

                    var typePresent = CountPresentSessions(
                        relevantAttendance.Where(a => g.Any(ev => ev.Id == a.EventId)).ToList(),
                        typeHeld,
                        g.ToList());
                    var typeHeldCount = typeHeld.Count;
                    var typeRate = typeHeldCount == 0 ? 0 : Math.Round((decimal)typePresent / typeHeldCount * 100m, 1);
                    activityRequirements.TryGetValue(g.Key.EventTypeId, out var activityRequired);
                    return new OfferingActivityAttendanceDto
                    {
                        EventTypeId = g.Key.EventTypeId,
                        EventTypeName = g.Key.Name,
                        PresentCount = typePresent,
                        HeldCount = typeHeldCount,
                        RatePercent = typeRate,
                        RequiredAttendancePercent = activityRequired,
                        MeetsRequirement = activityRequired.HasValue ? typeRate >= activityRequired.Value : null
                    };
                })
                .OrderBy(a => a.EventTypeName)
                .ToList();

            summaries.Add(new OfferingAttendanceSummaryDto
            {
                OfferingId = offering.Id,
                OfferingName = offering.Name,
                OfferingCode = offering.Code,
                RequiredAttendancePercent = required,
                PresentCount = present,
                HeldCount = held,
                RatePercent = rate,
                MeetsRequirement = meets,
                Activities = activities
            });
        }

        return new ServiceResponse<MyOfferingAttendanceResponse>(true, new MyOfferingAttendanceResponse
        {
            PeriodId = periodId ?? enrollments.FirstOrDefault()?.Offering?.PeriodId,
            Offerings = summaries.OrderBy(o => o.OfferingName).ToList()
        });
    }

    public async Task<ServiceResponse<WorkTimeTodayResponse>> GetWorkTimeAsync(
        int recentDays = 14,
        CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;
        var days = recentDays is > 0 and <= 90 ? recentDays : 14;
        var today = DateTime.UtcNow.Date;
        var from = today.AddDays(-(days - 1));

        var entries = await _db.WorkTimeEntries.AsNoTracking()
            .Where(e => e.UserId == userId && e.OrganizationId == orgId && e.WorkDate >= from && !e.IsDeleted)
            .OrderByDescending(e => e.WorkDate)
            .ToListAsync(cancellationToken);

        var todayEntry = entries.FirstOrDefault(e => e.WorkDate.Date == today);

        return new ServiceResponse<WorkTimeTodayResponse>(true, new WorkTimeTodayResponse
        {
            Today = todayEntry == null ? null : MapWorkTime(todayEntry),
            Recent = entries.Select(MapWorkTime).ToList()
        });
    }

    public async Task<ServiceResponse<WorkTimeEntryDto>> ClockInAsync(CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;
        var today = DateTime.UtcNow.Date;
        var now = DateTime.UtcNow;

        var existing = await _db.WorkTimeEntries
            .FirstOrDefaultAsync(e =>
                e.UserId == userId && e.OrganizationId == orgId && e.WorkDate == today && !e.IsDeleted,
                cancellationToken);

        if (existing?.ClockInUtc != null)
        {
            return new ServiceResponse<WorkTimeEntryDto>(false, null!,
                new AppError(ErrorCodes.Conflict, "You have already clocked in today."));
        }

        if (existing == null)
        {
            existing = new WorkTimeEntry
            {
                OrganizationId = orgId,
                UserId = userId,
                WorkDate = today,
                ClockInUtc = now,
                BreakMinutes = 0
            };
            await _db.WorkTimeEntries.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing.ClockInUtc = now;
            _db.WorkTimeEntries.Update(existing);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new ServiceResponse<WorkTimeEntryDto>(true, MapWorkTime(existing));
    }

    public async Task<ServiceResponse<WorkTimeEntryDto>> ClockOutAsync(CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;
        var today = DateTime.UtcNow.Date;
        var now = DateTime.UtcNow;

        var entry = await _db.WorkTimeEntries
            .FirstOrDefaultAsync(e =>
                e.UserId == userId && e.OrganizationId == orgId && e.WorkDate == today && !e.IsDeleted,
                cancellationToken);

        if (entry?.ClockInUtc == null)
        {
            return new ServiceResponse<WorkTimeEntryDto>(false, null!,
                new AppError(ErrorCodes.NotFound, "Clock in first to start your workday."));
        }

        if (entry.ClockOutUtc != null)
        {
            return new ServiceResponse<WorkTimeEntryDto>(false, null!,
                new AppError(ErrorCodes.Conflict, "You have already clocked out today."));
        }

        entry.ClockOutUtc = now;
        _db.WorkTimeEntries.Update(entry);
        await _db.SaveChangesAsync(cancellationToken);
        return new ServiceResponse<WorkTimeEntryDto>(true, MapWorkTime(entry));
    }

    public async Task<ServiceResponse<WorkTimeEntryDto>> SetTodayBreakAsync(
        SetWorkBreakRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;
        var today = DateTime.UtcNow.Date;

        var entry = await _db.WorkTimeEntries
            .FirstOrDefaultAsync(e =>
                e.UserId == userId && e.OrganizationId == orgId && e.WorkDate == today && !e.IsDeleted,
                cancellationToken);

        if (entry?.ClockInUtc == null)
        {
            return new ServiceResponse<WorkTimeEntryDto>(false, null!,
                new AppError(ErrorCodes.NotFound, "Clock in first to track break time."));
        }

        entry.BreakMinutes = request.BreakMinutes;
        _db.WorkTimeEntries.Update(entry);
        await _db.SaveChangesAsync(cancellationToken);
        return new ServiceResponse<WorkTimeEntryDto>(true, MapWorkTime(entry));
    }

    private static AttendanceStatus RosterDisplayStatus(AttendanceStatus? status) =>
        status is AttendanceStatus.Expected or null ? AttendanceStatus.None : status.Value;

    private async Task<List<(Guid UserId, string DisplayName, string? CohortGroupName)>> ResolveRosterMembersForInstanceAsync(
        Event evt,
        DateTime instanceDate,
        IReadOnlyDictionary<Guid, EventAttendance> attendances,
        CancellationToken cancellationToken)
    {
        var members = await ResolveRosterMembersAsync(evt, cancellationToken);

        var declinedIds = attendances.Values
            .Where(a => a.Status == AttendanceStatus.Declined)
            .Select(a => a.UserId)
            .ToHashSet();

        var filtered = members.Where(m => !declinedIds.Contains(m.UserId)).ToList();
        var knownIds = filtered.Select(m => m.UserId).ToHashSet();

        var swapInIds = attendances.Values
            .Where(a => a.Status == AttendanceStatus.Added && !knownIds.Contains(a.UserId))
            .Select(a => a.UserId)
            .Distinct()
            .ToList();

        if (swapInIds.Count > 0)
        {
            var users = await _db.Users.AsNoTracking()
                .Where(u => swapInIds.Contains(u.Id))
                .ToListAsync(cancellationToken);

            foreach (var user in users)
            {
                filtered.Add((
                    user.Id,
                    $"{user.FirstName} {user.LastName}".Trim(),
                    "Alternate section"));
            }

            filtered = filtered.OrderBy(m => m.DisplayName).ToList();
        }

        return filtered;
    }

    private async Task<List<(Guid UserId, string DisplayName, string? CohortGroupName)>> ResolveRosterMembersAsync(
        Event evt,
        CancellationToken cancellationToken)
    {
        if (evt.OfferingId.HasValue)
        {
            var query = _db.OfferingEnrollments.AsNoTracking()
                .Include(e => e.User)
                .Include(e => e.CohortGroup)
                .Where(e => e.OfferingId == evt.OfferingId.Value && !e.IsDeleted);

            var rows = await query.ToListAsync(cancellationToken);
            return rows
                .Where(e => EventAudienceHelper.EnrollmentMatchesEvent(e, evt))
                .Select(e => (
                    e.UserId,
                    DisplayName: $"{e.User.FirstName} {e.User.LastName}".Trim(),
                    CohortGroupName: e.CohortGroup?.Name))
                .OrderBy(r => r.DisplayName)
                .ToList();
        }

        if (evt.GroupId.HasValue)
        {
            var userIds = await _groupScope.GetMemberUserIdsInScopeAsync(evt.OrganizationId, evt.GroupId.Value);
            if (userIds.Count == 0)
                return new List<(Guid, string, string?)>();

            var users = await _db.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync(cancellationToken);

            return users
                .Select(u => (
                    u.Id,
                    DisplayName: $"{u.FirstName} {u.LastName}".Trim(),
                    CohortGroupName: (string?)null))
                .OrderBy(r => r.DisplayName)
                .ToList();
        }

        return new List<(Guid, string, string?)>();
    }

    private static int CountPresentSessions(
        IReadOnlyList<EventAttendance> attendance,
        HashSet<(Guid Id, DateTime Instance)> heldKeys,
        IReadOnlyList<Event> events)
    {
        var present = 0;
        foreach (var key in heldKeys)
        {
            var att = attendance.FirstOrDefault(a =>
                a.EventId == key.Id && a.InstanceDate.Date == key.Instance);
            if (att != null && IsPresent(att.Status, isCorporate: false))
                present++;
        }

        return present;
    }

    private static WorkTimeEntryDto MapWorkTime(WorkTimeEntry entry)
    {
        var worked = 0;
        if (entry.ClockInUtc.HasValue && entry.ClockOutUtc.HasValue)
        {
            var span = entry.ClockOutUtc.Value - entry.ClockInUtc.Value;
            worked = Math.Max(0, (int)span.TotalMinutes - entry.BreakMinutes);
        }

        return new WorkTimeEntryDto
        {
            Id = entry.Id,
            WorkDate = entry.WorkDate,
            ClockInUtc = entry.ClockInUtc,
            ClockOutUtc = entry.ClockOutUtc,
            BreakMinutes = entry.BreakMinutes,
            WorkedMinutes = worked
        };
    }
}
