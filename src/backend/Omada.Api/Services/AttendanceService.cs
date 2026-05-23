using Omada.Api.Abstractions;
using Omada.Api.DTOs.Attendance;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
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

    public AttendanceService(
        IAttendanceRepository attendanceRepository,
        IUserContext userContext,
        IGroupService groupService,
        IScheduleService scheduleService)
    {
        _attendanceRepository = attendanceRepository;
        _userContext = userContext;
        _groupService = groupService;
        _scheduleService = scheduleService;
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
            userId, configResponse.Data, cancellationToken);

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
            MaxCapacity = item.MaxCapacity
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
}
