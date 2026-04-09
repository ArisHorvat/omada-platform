using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class ScheduleService : IScheduleService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IScheduleRepository _scheduleRepo;
    private readonly IRoomRepository _roomRepo;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public ScheduleService(
        IUnitOfWork uow, 
        IUserContext userContext, 
        IScheduleRepository scheduleRepo,
        IRoomRepository roomRepo,
        IPublicMediaUrlResolver mediaUrls)
    {
        _uow = uow;
        _userContext = userContext;
        _scheduleRepo = scheduleRepo;
        _roomRepo = roomRepo;
        _mediaUrls = mediaUrls;
    }

    // 1. GET SCHEDULE
    public async Task<ServiceResponse<IEnumerable<ScheduleItemDto>>> GetScheduleAsync(GetScheduleRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId; // 🚀 Get Current User

        var events = await _scheduleRepo.GetEventsForScheduleAsync(
            orgId, request.FromDate, request.ToDate,
            request.HostId, request.GroupId, request.RoomId,
            userId, request.MyScheduleOnly, request.PublicOnly);

        var dtos = BuildScheduleItems(events, request, userId);
        return new ServiceResponse<IEnumerable<ScheduleItemDto>>(true, dtos.OrderBy(x => x.StartTime));
    }

    public async Task<ServiceResponse<IEnumerable<BusyIntervalDto>>> GetBusyIntervalsAsync(Guid userId, DateTime from, DateTime to)
    {
        var orgId = _userContext.OrganizationId;

        var isMember = await _uow.Repository<OrganizationMember>()
            .GetQueryable()
            .AnyAsync(m => m.OrganizationId == orgId && m.UserId == userId && m.IsActive);

        if (!isMember)
            return new ServiceResponse<IEnumerable<BusyIntervalDto>>(false, null, new AppError("NOT_FOUND", "User is not in this organization."));

        var events = await _scheduleRepo.GetEventsForScheduleAsync(
            orgId, from, to, null, null, null, userId, myScheduleOnly: true, publicOnly: false);

        var request = new GetScheduleRequest { FromDate = from, ToDate = to, MyScheduleOnly = true };
        var items = BuildScheduleItems(events, request, userId);
        var busy = items.Select(i => new BusyIntervalDto { StartTime = i.StartTime, EndTime = i.EndTime }).ToList();
        return new ServiceResponse<IEnumerable<BusyIntervalDto>>(true, busy);
    }

    public async Task<ServiceResponse<bool>> ProposeMeetingTimeAsync(Guid eventId, ProposeMeetingTimeRequest body)
    {
        var orgId = _userContext.OrganizationId;
        var me = _userContext.UserId;

        var ev = await _uow.Repository<Event>()
            .GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OrganizationId == orgId && !e.IsDeleted);

        if (ev == null)
            return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Event not found."));

        var proposer = await _uow.Repository<User>().GetByIdAsync(me);
        if (proposer == null)
            return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "User not found."));

        var content =
            $"[Proposed meeting time] {proposer.FirstName} {proposer.LastName} suggests a new time for \"{ev.Title}\" " +
            $"(event {eventId}): {body.ProposedStart:u} – {body.ProposedEnd:u}.";
        if (!string.IsNullOrWhiteSpace(body.Message))
            content += " " + body.Message.Trim();
        if (ev.HostId.HasValue)
            content += $" (HostId: {ev.HostId.Value})";

        await _uow.Repository<Message>().AddAsync(new Message
        {
            OrganizationId = orgId,
            UserId = me,
            UserName = $"{proposer.FirstName} {proposer.LastName}",
            Content = content
        });
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    private List<ScheduleItemDto> BuildScheduleItems(IEnumerable<Event> events, GetScheduleRequest request, Guid userId)
    {
        var dtos = new List<ScheduleItemDto>();

        foreach (var e in events)
        {
            if (request.EventTypeId.HasValue && e.EventTypeId != request.EventTypeId) continue;

            if (string.IsNullOrEmpty(e.RecurrenceRule))
            {
                var isCancelled = e.Overrides.Any(o => o.OriginalStartTime == e.StartTime && o.IsCancelled);
                var isDeclined = request.MyScheduleOnly && e.Attendances.Any(a =>
                    a.UserId == userId && a.InstanceDate == e.StartTime && a.Status == AttendanceStatus.Declined);

                if (!isCancelled && !isDeclined)
                    dtos.Add(MapToDto(e, e.StartTime, e.EndTime));
            }
            else
            {
                dtos.AddRange(ExpandRecurrence(e, request.FromDate, request.ToDate, request.MyScheduleOnly ? userId : null));
            }
        }

        return dtos;
    }

    // 2. GET EVENT TYPES (Dynamic)
    public async Task<ServiceResponse<IEnumerable<EventTypeDto>>> GetEventTypesAsync()
    {
        var orgId = _userContext.OrganizationId;
        
        var types = await _uow.Repository<EventType>()
            .GetQueryable()
            .AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Name)
            .Select(x => new EventTypeDto 
            { 
                Id = x.Id, 
                Name = x.Name, 
                Color = x.ColorHex 
            })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<EventTypeDto>>(true, types);
    }

    /// <summary>
    /// Returns whether a user appears <c>Offline</c> (not in org), <c>Busy</c> (hosting an event now), or <c>Free</c>.
    /// Uses host-only events for the current instant (UTC).
    /// </summary>
    public async Task<ServiceResponse<ScheduleUserStatusDto>> GetUserScheduleStatusAsync(Guid userId)
    {
        var orgId = _userContext.OrganizationId;
        var now = DateTime.UtcNow;

        var isMember = await _uow.Repository<OrganizationMember>()
            .GetQueryable()
            .AnyAsync(m => m.OrganizationId == orgId && m.UserId == userId && m.IsActive);

        if (!isMember)
            return new ServiceResponse<ScheduleUserStatusDto>(true, new ScheduleUserStatusDto { Status = "Offline" });

        var from = now.Date;
        var to = from.AddDays(1);

        var request = new GetScheduleRequest
        {
            FromDate = from,
            ToDate = to,
            HostId = userId,
            MyScheduleOnly = false
        };

        var scheduleResponse = await GetScheduleAsync(request);
        if (!scheduleResponse.IsSuccess || scheduleResponse.Data == null)
            return new ServiceResponse<ScheduleUserStatusDto>(true, new ScheduleUserStatusDto { Status = "Free" });

        foreach (var item in scheduleResponse.Data)
        {
            if (item.StartTime <= now && now < item.EndTime)
                return new ServiceResponse<ScheduleUserStatusDto>(true, new ScheduleUserStatusDto { Status = "Busy" });
        }

        return new ServiceResponse<ScheduleUserStatusDto>(true, new ScheduleUserStatusDto { Status = "Free" });
    }

    // 3. CREATE EVENT
    public async Task<ServiceResponse<ScheduleItemDto>> CreateEventAsync(CreateEventRequest request)
    {
        var orgId = _userContext.OrganizationId;

        // A. Validate Room Restrictions
        if (request.RoomId.HasValue)
        {
            var room = await _roomRepo.GetRoomWithRestrictionsAsync(request.RoomId.Value);
            if (room == null) 
                return new ServiceResponse<ScheduleItemDto>(false, null, new AppError("NOT_FOUND", "Room not found."));

            if (room.AllowedEventTypes.Any() && !room.AllowedEventTypes.Any(et => et.Id == request.EventTypeId))
            {
                return new ServiceResponse<ScheduleItemDto>(false, null, new AppError("RESTRICTED_ROOM", 
                    $"Room '{room.Name}' does not support this event type."));
            }
        }

        // B. Check Conflicts
        var conflict = await _scheduleRepo.GetConflictAsync(orgId, request.StartTime, request.EndTime, request.RoomId, request.HostId);
        if (conflict != null)
        {
            return new ServiceResponse<ScheduleItemDto>(false, null, new AppError("CONFLICT", $"Conflict with '{conflict.Title}'"));
        }

        // C. Create Entity
        var newEvent = new Event
        {
            OrganizationId = orgId,
            Title = request.Title,
            Description = request.Description,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            EventTypeId = request.EventTypeId,
            ColorHex = request.ColorHex,
            RoomId = request.RoomId,
            HostId = request.HostId,
            GroupId = request.GroupId,
            RecurrenceRule = request.RecurrenceRule,
            MaxCapacity = request.MaxCapacity,
            IsPublic = request.IsPublic
        };

        await _uow.Repository<Event>().AddAsync(newEvent);
        await _uow.CompleteAsync();

        // D. Load Relations for DTO
        await LoadEventRelationsAsync(newEvent);

        return new ServiceResponse<ScheduleItemDto>(true, MapToDto(newEvent, newEvent.StartTime, newEvent.EndTime));
    }

    // 4. UPDATE EVENT
    public async Task<ServiceResponse<ScheduleItemDto>> UpdateEventAsync(Guid id, CreateEventRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var eventEntity = await _uow.Repository<Event>().GetByIdAsync(id);

        if (eventEntity == null || eventEntity.OrganizationId != orgId)
            return new ServiceResponse<ScheduleItemDto>(false, null, new AppError("NOT_FOUND", "Event not found."));

        // A. Validate Room Restrictions (Only if Room or Type changed)
        if (request.RoomId.HasValue && (request.RoomId != eventEntity.RoomId || request.EventTypeId != eventEntity.EventTypeId))
        {
            var room = await _roomRepo.GetRoomWithRestrictionsAsync(request.RoomId.Value);
            if (room != null && room.AllowedEventTypes.Any() && !room.AllowedEventTypes.Any(et => et.Id == request.EventTypeId))
            {
                return new ServiceResponse<ScheduleItemDto>(false, null, new AppError("RESTRICTED_ROOM", 
                    $"Room '{room.Name}' does not support this event type."));
            }
        }

        // B. Check Conflicts (Exclude self)
        var conflict = await _scheduleRepo.GetConflictAsync(orgId, request.StartTime, request.EndTime, request.RoomId, request.HostId);
        if (conflict != null && conflict.Id != id)
        {
            return new ServiceResponse<ScheduleItemDto>(false, null, new AppError("CONFLICT", $"Conflict with '{conflict.Title}'"));
        }

        // C. Update Fields
        eventEntity.Title = request.Title;
        eventEntity.Description = request.Description;
        eventEntity.StartTime = request.StartTime;
        eventEntity.EndTime = request.EndTime;
        eventEntity.EventTypeId = request.EventTypeId;
        eventEntity.ColorHex = request.ColorHex;
        eventEntity.RoomId = request.RoomId;
        eventEntity.HostId = request.HostId;
        eventEntity.GroupId = request.GroupId;
        eventEntity.RecurrenceRule = request.RecurrenceRule;
        eventEntity.MaxCapacity = request.MaxCapacity;

        _uow.Repository<Event>().Update(eventEntity);
        await _uow.CompleteAsync();

        // D. Load Relations for DTO
        await LoadEventRelationsAsync(eventEntity);

        return new ServiceResponse<ScheduleItemDto>(true, MapToDto(eventEntity, eventEntity.StartTime, eventEntity.EndTime));
    }

    public async Task<ServiceResponse<bool>> UpdateAttendanceAsync(Guid eventId, UpdateAttendanceRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        if (request.Status == AttendanceStatus.None)
            return new ServiceResponse<bool>(false, false, new AppError("INVALID_INPUT", "Attendance status cannot be None."));

        var targetEvent = await _uow.Repository<Event>().GetQueryable()
            .Include(e => e.Overrides)
            .Include(e => e.Attendances)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OrganizationId == orgId && !e.IsDeleted);

        if (targetEvent == null)
            return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Event not found."));

        var duration = targetEvent.EndTime - targetEvent.StartTime;
        DateTime targetStart;
        DateTime targetEnd;
        if (string.IsNullOrEmpty(targetEvent.RecurrenceRule))
        {
            targetStart = targetEvent.StartTime;
            targetEnd = targetEvent.EndTime;
            if (!AttendanceInstanceMatches(request.InstanceDate, targetStart))
                return new ServiceResponse<bool>(false, false, new AppError("INVALID_INPUT", "Instance date does not match this event."));
        }
        else
        {
            targetStart = request.InstanceDate;
            targetEnd = request.InstanceDate.Add(duration);
        }

        if (targetEvent.Overrides.Any(o => AttendanceInstanceMatches(o.OriginalStartTime, targetStart) && o.IsCancelled))
            return new ServiceResponse<bool>(false, false, new AppError("INVALID_INPUT", "This occurrence is cancelled."));

        if (request.DeclineEventId.HasValue)
        {
            if (!request.DeclineInstanceDate.HasValue)
                return new ServiceResponse<bool>(false, false, new AppError("INVALID_INPUT", "DeclineInstanceDate is required when DeclineEventId is set."));

            var declineEvent = await _uow.Repository<Event>().GetQueryable()
                .FirstOrDefaultAsync(e => e.Id == request.DeclineEventId.Value && e.OrganizationId == orgId && !e.IsDeleted);

            if (declineEvent == null)
                return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Event to decline was not found."));

            var declineCandidates = await _uow.Repository<EventAttendance>().GetQueryable()
                .Where(a => a.EventId == declineEvent.Id && a.UserId == userId)
                .ToListAsync();
            var declineExisting = declineCandidates.FirstOrDefault(a =>
                AttendanceInstanceMatches(a.InstanceDate, request.DeclineInstanceDate.Value));

            if (declineExisting == null)
                return new ServiceResponse<bool>(false, false, new AppError("INVALID_INPUT", "No attendance record found for the class instance to decline."));

            declineExisting.Status = AttendanceStatus.Declined;
            _uow.Repository<EventAttendance>().Update(declineExisting);
        }

        var wantsBlocking = CountsTowardRsvp(request.Status);

        if (wantsBlocking)
        {
            var hasOverlap = await HasUserBlockingAttendanceOverlapAsync(
                userId,
                orgId,
                targetStart,
                targetEnd,
                targetEvent.Id,
                request.InstanceDate,
                request.DeclineEventId,
                request.DeclineInstanceDate);

            if (hasOverlap)
                return new ServiceResponse<bool>(false, false, new AppError("SCHEDULE_CONFLICT",
                    "You already have a class or enrollment at this time."));
        }

        var attendanceCandidates = await _uow.Repository<EventAttendance>().GetQueryable()
            .Where(a => a.EventId == eventId && a.UserId == userId)
            .ToListAsync();
        var existingTarget = attendanceCandidates.FirstOrDefault(a =>
            AttendanceInstanceMatches(a.InstanceDate, request.InstanceDate));

        if (wantsBlocking && targetEvent.MaxCapacity.HasValue)
        {
            var effective = EffectiveRsvpCountAfterChange(targetEvent, request.InstanceDate, userId, request.Status, existingTarget);
            if (effective > targetEvent.MaxCapacity.Value)
                return new ServiceResponse<bool>(false, false, new AppError("CAPACITY_FULL", "This occurrence is at capacity."));
        }

        if (existingTarget != null)
        {
            existingTarget.Status = request.Status;
            _uow.Repository<EventAttendance>().Update(existingTarget);
        }
        else
        {
            await _uow.Repository<EventAttendance>().AddAsync(new EventAttendance
            {
                EventId = eventId,
                UserId = userId,
                InstanceDate = request.InstanceDate,
                Status = request.Status
            });
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<IEnumerable<ScheduleItemDto>>> GetAlternativeClassTimesAsync(Guid eventId, DateTime instanceDate)
    {
        var orgId = _userContext.OrganizationId;

        var refEvent = await _uow.Repository<Event>().GetQueryable()
            .AsNoTracking()
            .Include(e => e.Overrides)
            .Include(e => e.Attendances)
            .Include(e => e.EventType)
            .Include(e => e.Room)
            .Include(e => e.Group)
            .Include(e => e.Host)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.OrganizationId == orgId && !e.IsDeleted);

        if (refEvent == null)
            return new ServiceResponse<IEnumerable<ScheduleItemDto>>(false, null, new AppError("NOT_FOUND", "Event not found."));

        var weekStart = StartOfWeekMondayUtc(instanceDate);
        var weekEnd = weekStart.AddDays(7);

        var candidates = await _uow.Repository<Event>().GetQueryable()
            .AsNoTracking()
            .Include(e => e.Overrides)
            .Include(e => e.Attendances)
            .Include(e => e.EventType)
            .Include(e => e.Room)
            .Include(e => e.Group)
            .Include(e => e.Host)
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted
                && e.Id != eventId
                && e.Title == refEvent.Title
                && e.EventTypeId == refEvent.EventTypeId)
            .ToListAsync();

        var dtos = new List<ScheduleItemDto>();
        foreach (var e in candidates)
        {
            if (string.IsNullOrEmpty(e.RecurrenceRule))
            {
                if (e.StartTime >= weekStart && e.StartTime < weekEnd &&
                    !e.Overrides.Any(o => o.OriginalStartTime == e.StartTime && o.IsCancelled))
                    dtos.Add(MapToDto(e, e.StartTime, e.EndTime));
            }
            else
            {
                dtos.AddRange(ExpandRecurrence(e, weekStart, weekEnd, null));
            }
        }

        return new ServiceResponse<IEnumerable<ScheduleItemDto>>(true, dtos.OrderBy(x => x.StartTime));
    }

    // 5. DELETE EVENT
    public async Task<ServiceResponse<bool>> DeleteEventAsync(Guid id)
    {
        var orgId = _userContext.OrganizationId;
        var eventEntity = await _uow.Repository<Event>().GetByIdAsync(id);

        if (eventEntity == null || eventEntity.OrganizationId != orgId)
            return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Event not found."));

        _uow.Repository<Event>().Remove(eventEntity);
        await _uow.CompleteAsync();

        return new ServiceResponse<bool>(true, true);
    }

    // 6. CANCEL INSTANCE
    public async Task<ServiceResponse<bool>> CancelEventInstanceAsync(Guid id, DateTime originalDate)
    {
        var orgId = _userContext.OrganizationId;
        // Verify event exists
        var eventEntity = await _uow.Repository<Event>().GetByIdAsync(id);
        if (eventEntity == null || eventEntity.OrganizationId != orgId)
             return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Event not found."));

        // Check if override exists
        var existingOverride = await _uow.Repository<EventOverride>()
            .GetQueryable()
            .FirstOrDefaultAsync(o => o.EventId == id && o.OriginalStartTime == originalDate);

        if (existingOverride == null)
        {
            var overrideEntity = new EventOverride
            {
                EventId = id,
                OriginalStartTime = originalDate,
                IsCancelled = true
            };
            await _uow.Repository<EventOverride>().AddAsync(overrideEntity);
        }
        else
        {
            existingOverride.IsCancelled = true;
            _uow.Repository<EventOverride>().Update(existingOverride);
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    // 1. Calls Repo to get 'User' entities
    // 2. Maps 'User' -> 'HostDto' here in the Service
    public async Task<ServiceResponse<IEnumerable<HostDto>>> SearchHostsAsync(string query)
    {
        var orgId = _userContext.OrganizationId;
        
        // 1. Get raw entities from Repository (returns IEnumerable<User>)
        var users = await _scheduleRepo.SearchHostsAsync(orgId, query);
        
        // 2. Map to DTO in Service
        var dtos = users.Select(u => new HostDto 
        { 
            Id = u.Id, 
            FullName = $"{u.FirstName} {u.LastName}", 
            AvatarUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(u.AvatarUrl) ? null : u.AvatarUrl)
        });
        
        return new ServiceResponse<IEnumerable<HostDto>>(true, dtos);
    }


    // --- HELPERS ---

    private async Task LoadEventRelationsAsync(Event e)
    {
        if (e.EventTypeId != Guid.Empty)
            e.EventType = await _uow.Repository<EventType>().GetByIdAsync(e.EventTypeId);

        if (e.RoomId.HasValue)
            e.Room = await _uow.Repository<Room>().GetByIdAsync(e.RoomId.Value);

        if (e.GroupId.HasValue)
            e.Group = await _uow.Repository<Group>().GetByIdAsync(e.GroupId.Value);

        if (e.HostId.HasValue)
            e.Host = await _uow.Repository<User>().GetByIdAsync(e.HostId.Value);
    }

    private IEnumerable<ScheduleItemDto> ExpandRecurrence(Event e, DateTime rangeStart, DateTime rangeEnd, Guid? userId)
    {
        var occurrences = new List<ScheduleItemDto>();
        // NOTE: For robustness, I recommend using the "Ical.Net" library here in the future.
        // This is a simplified recurrence logic for DAILY/WEEKLY.
        
        var rule = e.RecurrenceRule;
        if (string.IsNullOrEmpty(rule)) return occurrences;

        var interval = 1;
        var intervalMatch = System.Text.RegularExpressions.Regex.Match(rule, "INTERVAL=(\\d+)");
        if (intervalMatch.Success) interval = int.Parse(intervalMatch.Groups[1].Value);

        var isDaily = rule.Contains("FREQ=DAILY");
        var isWeekly = rule.Contains("FREQ=WEEKLY");
        var isMonthly = rule.Contains("FREQ=MONTHLY");
        var isYearly = rule.Contains("FREQ=YEARLY");

        // Parse Until
        DateTime? untilDate = null;
        var untilMatch = System.Text.RegularExpressions.Regex.Match(rule, "UNTIL=(\\d{8}T\\d{6}Z)");
        if (untilMatch.Success)
        {
            if (DateTime.TryParseExact(untilMatch.Groups[1].Value, "yyyyMMddTHHmmssZ", 
                null, System.Globalization.DateTimeStyles.AdjustToUniversal, out DateTime parsedUntil))
            {
                untilDate = parsedUntil;
            }
        }

        var duration = e.EndTime - e.StartTime;
        var currentStart = e.StartTime;
        var currentEnd = e.EndTime;

        // Skip instances before range
        while (currentEnd < rangeStart)
        {
            if (isDaily) currentStart = currentStart.AddDays(interval);
            else if (isWeekly) currentStart = currentStart.AddDays(7 * interval);
            else if (isMonthly) currentStart = currentStart.AddMonths(interval);
            else if (isYearly) currentStart = currentStart.AddYears(interval);
            else break;
            
            currentEnd = currentStart.Add(duration);
            
            // Safety break
            if (currentStart > rangeEnd.AddYears(1)) break; 
        }

        // Add instances within range
        while (currentStart < rangeEnd)
        {
            if (untilDate.HasValue && currentStart > untilDate.Value) break;

            // Check Overrides
            var overrideData = e.Overrides.FirstOrDefault(o => o.OriginalStartTime == currentStart);
            var isCancelled = overrideData != null && overrideData.IsCancelled;
            
            var isDeclined = userId.HasValue && e.Attendances.Any(a => 
                a.UserId == userId.Value && 
                a.InstanceDate == currentStart && 
                a.Status == AttendanceStatus.Declined);
            
            if (!isCancelled && !isDeclined)
            {
                occurrences.Add(MapToDto(e, currentStart, currentEnd));
            }

            // Next step
            if (isDaily) currentStart = currentStart.AddDays(interval);
            else if (isWeekly) currentStart = currentStart.AddDays(7 * interval);
            else if (isMonthly) currentStart = currentStart.AddMonths(interval);
            else if (isYearly) currentStart = currentStart.AddYears(interval);
            else break;

            currentEnd = currentStart.Add(duration);
        }

        return occurrences;
    }

    /// <summary>
    /// Schedule times are stored as UTC instants; DTOs serialize with Z so clients send matching attendance instance dates.
    /// </summary>
    private static DateTime AsUtcScheduleInstant(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private ScheduleItemDto MapToDto(Event e, DateTime start, DateTime end)
    {
        return new ScheduleItemDto
        {
            Id = e.Id,
            Title = e.Title,
            Subtitle = e.Description ?? "",
            StartTime = AsUtcScheduleInstant(start),
            EndTime = AsUtcScheduleInstant(end),
            
            // Logic: Event Color > Type Color > Default
            Color = !string.IsNullOrEmpty(e.ColorHex) ? e.ColorHex : (e.EventType?.ColorHex ?? "#3b82f6"),
            
            EventTypeId = e.EventTypeId,
            TypeName = e.EventType?.Name ?? "Event",
            
            RoomId = e.RoomId,
            RoomName = e.Room?.Name,
            
            HostId = e.HostId,
            HostName = e.Host != null ? $"{e.Host.FirstName} {e.Host.LastName}" : null,
            
            GroupId = e.GroupId,
            GroupName = e.Group?.Name,
            
            RecurrenceRule = e.RecurrenceRule,
            MaxCapacity = e.MaxCapacity,
            CurrentRSVPCount = CountRsvpForInstance(e, start),
            IsPublic = e.IsPublic
        };
    }

    private static int CountRsvpForInstance(Event e, DateTime instanceStart) =>
        e.Attendances.Count(a => a.InstanceDate == instanceStart && CountsTowardRsvp(a.Status));

    private static bool CountsTowardRsvp(AttendanceStatus s) =>
        s is AttendanceStatus.Added or AttendanceStatus.Expected or AttendanceStatus.Accepted or AttendanceStatus.Tentative;

    private static int EffectiveRsvpCountAfterChange(
        Event e,
        DateTime instanceDate,
        Guid userId,
        AttendanceStatus newStatus,
        EventAttendance? existingForUser)
    {
        var count = e.Attendances.Count(a => a.InstanceDate == instanceDate && CountsTowardRsvp(a.Status));
        var was = existingForUser != null && CountsTowardRsvp(existingForUser.Status);
        var will = CountsTowardRsvp(newStatus);
        if (existingForUser != null && existingForUser.UserId == userId)
            return count - (was ? 1 : 0) + (will ? 1 : 0);
        return count + (will ? 1 : 0);
    }

    private async Task<bool> HasUserBlockingAttendanceOverlapAsync(
        Guid userId,
        Guid orgId,
        DateTime targetStart,
        DateTime targetEnd,
        Guid targetEventId,
        DateTime targetInstanceDate,
        Guid? excludeSwapFromEventId,
        DateTime? excludeSwapFromInstanceDate)
    {
        var rows = await _uow.Repository<EventAttendance>()
            .GetQueryable()
            .AsNoTracking()
            .Include(a => a.Event)
                .ThenInclude(ev => ev!.Overrides)
            .Where(a => a.UserId == userId
                && a.Event != null
                && a.Event.OrganizationId == orgId
                && !a.Event.IsDeleted
                && (a.Status == AttendanceStatus.Expected || a.Status == AttendanceStatus.Added))
            .ToListAsync();

        foreach (var a in rows)
        {
            var ev = a.Event;
            if (ev == null) continue;

            if (a.EventId == targetEventId && a.InstanceDate == targetInstanceDate)
                continue;

            if (excludeSwapFromEventId.HasValue && excludeSwapFromInstanceDate.HasValue
                && a.EventId == excludeSwapFromEventId.Value
                && a.InstanceDate == excludeSwapFromInstanceDate.Value)
                continue;

            var (occStart, occEnd) = GetOccurrenceWindow(ev, a.InstanceDate);
            if (ev.Overrides.Any(o => o.OriginalStartTime == occStart && o.IsCancelled))
                continue;

            if (occStart < targetEnd && occEnd > targetStart)
                return true;
        }

        return false;
    }

    private static (DateTime start, DateTime end) GetOccurrenceWindow(Event e, DateTime instanceDate)
    {
        var duration = e.EndTime - e.StartTime;
        if (string.IsNullOrEmpty(e.RecurrenceRule))
            return (e.StartTime, e.EndTime);
        return (instanceDate, instanceDate.Add(duration));
    }

    private static DateTime StartOfWeekMondayUtc(DateTime dateTime)
    {
        var d = dateTime.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(dateTime.Date, DateTimeKind.Utc)
            : dateTime.ToUniversalTime().Date;
        var diff = (7 + (int)d.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        return d.AddDays(-diff);
    }

    /// <summary>
    /// Matches attendance rows to the same calendar minute in UTC (ignores seconds/milliseconds and Kind drift).
    /// </summary>
    private static bool AttendanceInstanceMatches(DateTime a, DateTime b)
    {
        var au = AsUtcScheduleInstant(a);
        var bu = AsUtcScheduleInstant(b);
        return au.Year == bu.Year && au.Month == bu.Month && au.Day == bu.Day
            && au.Hour == bu.Hour && au.Minute == bu.Minute;
    }
}