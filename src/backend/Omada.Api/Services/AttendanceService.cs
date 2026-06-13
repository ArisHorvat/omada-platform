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
    private const int TeacherSessionDays = 7;

    private readonly IAttendanceRepository _attendanceRepository;
    private readonly IUserContext _userContext;
    private readonly IGroupService _groupService;
    private readonly IScheduleService _scheduleService;
    private readonly ApplicationDbContext _db;

    public AttendanceService(
        IAttendanceRepository attendanceRepository,
        IUserContext userContext,
        IGroupService groupService,
        IScheduleService scheduleService,
        ApplicationDbContext db)
    {
        _attendanceRepository = attendanceRepository;
        _userContext = userContext;
        _groupService = groupService;
        _scheduleService = scheduleService;
        _db = db;
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

        var records = rows.Select(r => MapRecord(r, orgKind)).ToList();
        var summary = BuildSummary(rows, orgKind);

        var nextSession = await ResolveNextSessionAsync(userId, organizationId, cancellationToken);
        var teacherSessions = await ResolveTeacherSessionsAsync(
            userId, organizationId, orgKind, configResponse.Data, cancellationToken);

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
            GroupId = row.Event.GroupId,
            GroupName = row.Event.Group?.Name,
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
        var schedule = await _scheduleService.GetScheduleAsync(new GetScheduleRequest
        {
            FromDate = from,
            ToDate = to,
            MyScheduleOnly = true,
            PublicOnly = false
        });

        if (!schedule.IsSuccess || schedule.Data == null)
            return null;

        var now = DateTime.UtcNow;
        var upcoming = schedule.Data
            .Where(s => s.EndTime > now)
            .OrderBy(s => s.StartTime)
            .FirstOrDefault();

        return upcoming == null ? null : MapSession(upcoming);
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

        var from = DateTime.UtcNow.Date;
        var to = from.AddDays(TeacherSessionDays);
        var sessions = new List<AttendanceSessionDto>();
        var seen = new HashSet<Guid>();

        async Task AddFromSchedule(GetScheduleRequest request)
        {
            var schedule = await _scheduleService.GetScheduleAsync(request);
            if (!schedule.IsSuccess || schedule.Data == null)
                return;

            foreach (var item in schedule.Data)
            {
                if (item.EndTime < DateTime.UtcNow)
                    continue;
                if (!seen.Add(item.Id))
                    continue;
                sessions.Add(MapSession(item));
            }
        }

        switch (config.Mode)
        {
            case "SessionManager":
                foreach (var group in config.Groups)
                {
                    await AddFromSchedule(new GetScheduleRequest
                    {
                        FromDate = from,
                        ToDate = to,
                        GroupId = group.Id,
                        MyScheduleOnly = false
                    });
                }
                break;
            case "UniversalSessionManager":
                await AddFromSchedule(new GetScheduleRequest
                {
                    FromDate = from,
                    ToDate = to,
                    MyScheduleOnly = false
                });
                break;
            case "Approval":
                if (config.Department != null)
                {
                    await AddFromSchedule(new GetScheduleRequest
                    {
                        FromDate = from,
                        ToDate = to,
                        GroupId = config.Department.Id,
                        MyScheduleOnly = false
                    });
                }
                break;
            default:
                await AddFromSchedule(new GetScheduleRequest
                {
                    FromDate = from,
                    ToDate = to,
                    HostId = userId,
                    MyScheduleOnly = false
                });
                break;
        }

        if (string.Equals(orgKind, "University", StringComparison.OrdinalIgnoreCase))
        {
            var teachingOfferingIds = await OfferingTeachingAuthorization.GetTeachingOfferingIdsAsync(
                _db, organizationId, userId);
            if (teachingOfferingIds.Count > 0)
            {
                var schedule = await _scheduleService.GetScheduleAsync(new GetScheduleRequest
                {
                    FromDate = from,
                    ToDate = to,
                    MyScheduleOnly = false
                });
                if (schedule.IsSuccess && schedule.Data != null)
                {
                    foreach (var item in schedule.Data)
                    {
                        if (item.EndTime < DateTime.UtcNow)
                            continue;
                        if (!item.OfferingId.HasValue || !teachingOfferingIds.Contains(item.OfferingId.Value))
                            continue;
                        if (!seen.Add(item.Id))
                            continue;
                        sessions.Add(MapSession(item));
                    }
                }
            }
        }

        return sessions
            .OrderBy(s => s.StartTime)
            .Take(20)
            .ToList();
    }

    private static AttendanceSessionDto MapSession(ScheduleItemDto item) =>
        new()
        {
            EventId = item.Id,
            Title = item.Title,
            GroupId = item.GroupId,
            GroupName = item.GroupName,
            RoomName = item.RoomName,
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            EnrolledCount = item.CurrentRSVPCount,
            MaxCapacity = item.MaxCapacity,
            OfferingId = item.OfferingId,
            OfferingName = item.OfferingName,
            EventTypeName = item.TypeName,
            InstanceDate = item.StartTime.Date
        };

    private static bool IsPresent(AttendanceStatus status, bool isCorporate)
    {
        if (status == AttendanceStatus.Declined || status == AttendanceStatus.None)
            return false;
        if (status == AttendanceStatus.Tentative)
            return false;
        if (isCorporate)
            return status is AttendanceStatus.Accepted or AttendanceStatus.Added or AttendanceStatus.Expected;
        return status is AttendanceStatus.Expected or AttendanceStatus.Added or AttendanceStatus.Accepted;
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
            AttendanceStatus.Expected or AttendanceStatus.Added or AttendanceStatus.Accepted => "Present",
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

        if (evt.OfferingId.HasValue)
        {
            var orgId = _userContext.OrganizationId;
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

        var instance = instanceDate.Date;
        var attendances = await _db.Set<EventAttendance>().AsNoTracking()
            .Where(a => a.EventId == eventId && a.InstanceDate.Date == instance && !a.IsDeleted)
            .ToDictionaryAsync(a => a.UserId, a => a, cancellationToken);

        var members = await ResolveRosterMembersAsync(evt, cancellationToken);
        var rows = members.Select(m =>
        {
            attendances.TryGetValue(m.UserId, out var att);
            var status = att?.Status ?? AttendanceStatus.None;
            return new AttendanceRosterMemberDto
            {
                UserId = m.UserId,
                DisplayName = m.DisplayName,
                CohortGroupName = m.CohortGroupName,
                Status = status,
                StatusLabel = StatusLabel(status == AttendanceStatus.None ? AttendanceStatus.None : status, isCorporate)
            };
        }).ToList();

        return new ServiceResponse<AttendanceSessionRosterDto>(true, new AttendanceSessionRosterDto
        {
            EventId = evt.Id,
            Title = evt.Title,
            OfferingId = evt.OfferingId,
            OfferingName = evt.Offering?.Name,
            EventTypeName = evt.EventType?.Name,
            InstanceDate = instance,
            StartTime = evt.StartTime,
            EndTime = evt.EndTime,
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

        foreach (var row in request.Rows)
        {
            if (row.Status == AttendanceStatus.None)
                continue;

            var update = new UpdateAttendanceRequest
            {
                InstanceDate = request.InstanceDate,
                Status = row.Status
            };
            var result = await _scheduleService.ApplyAttendanceForUserAsync(eventId, row.UserId, update);
            if (!result.IsSuccess)
                return result;
        }

        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<MyOfferingAttendanceResponse>> GetMyOfferingAttendanceAsync(
        Guid? periodId,
        CancellationToken cancellationToken = default)
    {
        var userId = _userContext.UserId;
        var orgId = _userContext.OrganizationId;

        var enrollmentsQuery = _db.OfferingEnrollments.AsNoTracking()
            .Include(e => e.Offering)
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
                offeringIds.Contains(e.OfferingId.Value) &&
                e.EndTime <= now)
            .ToListAsync(cancellationToken);

        var attendanceRows = await _db.Set<EventAttendance>().AsNoTracking()
            .Where(a =>
                a.UserId == userId &&
                !a.IsDeleted &&
                events.Select(ev => ev.Id).Contains(a.EventId))
            .ToListAsync(cancellationToken);

        var summaries = new List<OfferingAttendanceSummaryDto>();
        foreach (var enrollment in enrollments.GroupBy(e => e.OfferingId).Select(g => g.First()))
        {
            var offering = enrollment.Offering!;
            var offeringEvents = events
                .Where(ev => ev.OfferingId == offering.Id &&
                             (!ev.CohortGroupId.HasValue || ev.CohortGroupId == enrollment.CohortGroupId))
                .ToList();

            var heldKeys = offeringEvents
                .Select(ev => (ev.Id, Instance: ev.StartTime.Date))
                .ToHashSet();

            var relevantAttendance = attendanceRows
                .Where(a => offeringEvents.Any(ev => ev.Id == a.EventId))
                .ToList();

            var present = CountPresentSessions(relevantAttendance, heldKeys, offeringEvents);
            var held = heldKeys.Count;
            var rate = held == 0 ? 0 : Math.Round((decimal)present / held * 100m, 1);

            var required = offering.RequiredAttendancePercent;
            bool? meets = required.HasValue ? rate >= required.Value : null;

            var activities = offeringEvents
                .GroupBy(ev => new { ev.EventTypeId, Name = ev.EventType?.Name ?? "Session" })
                .Select(g =>
                {
                    var typeHeld = g.Select(ev => (ev.Id, Instance: ev.StartTime.Date)).ToHashSet();
                    var typePresent = CountPresentSessions(
                        relevantAttendance.Where(a => g.Any(ev => ev.Id == a.EventId)).ToList(),
                        typeHeld,
                        g.ToList());
                    var typeHeldCount = typeHeld.Count;
                    return new OfferingActivityAttendanceDto
                    {
                        EventTypeId = g.Key.EventTypeId,
                        EventTypeName = g.Key.Name,
                        PresentCount = typePresent,
                        HeldCount = typeHeldCount,
                        RatePercent = typeHeldCount == 0 ? 0 : Math.Round((decimal)typePresent / typeHeldCount * 100m, 1)
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

            if (evt.CohortGroupId.HasValue)
                query = query.Where(e => e.CohortGroupId == evt.CohortGroupId.Value);

            var rows = await query.ToListAsync(cancellationToken);
            return rows
                .Select(e => (
                    e.UserId,
                    DisplayName: $"{e.User.FirstName} {e.User.LastName}".Trim(),
                    CohortGroupName: e.CohortGroup?.Name))
                .OrderBy(r => r.DisplayName)
                .ToList();
        }

        if (evt.GroupId.HasValue)
        {
            var rows = await _db.GroupMembers.AsNoTracking()
                .Include(m => m.User)
                .Where(m => m.GroupId == evt.GroupId.Value)
                .ToListAsync(cancellationToken);
            return rows
                .Select(m => (
                    m.UserId,
                    DisplayName: $"{m.User.FirstName} {m.User.LastName}".Trim(),
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
