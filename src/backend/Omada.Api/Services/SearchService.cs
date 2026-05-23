using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Search;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class SearchService : ISearchService
{
    private static readonly Dictionary<string, string> TypeLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        [SearchTypes.Users] = "People",
        [SearchTypes.Rooms] = "Rooms",
        [SearchTypes.News] = "News",
        [SearchTypes.Tasks] = "Tasks",
        [SearchTypes.Schedule] = "Schedule",
        [SearchTypes.Groups] = "Groups",
        [SearchTypes.Grades] = "Grades",
    };

    private static readonly Dictionary<string, string> TypeWidgetKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        [SearchTypes.Users] = WidgetKeys.Users,
        [SearchTypes.Rooms] = WidgetKeys.Rooms,
        [SearchTypes.News] = WidgetKeys.News,
        [SearchTypes.Tasks] = WidgetKeys.Tasks,
        [SearchTypes.Schedule] = WidgetKeys.Schedule,
        [SearchTypes.Groups] = WidgetKeys.Groups,
        [SearchTypes.Grades] = WidgetKeys.Grades,
    };

    private readonly ApplicationDbContext _context;
    private readonly IUserContext _userContext;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public SearchService(
        ApplicationDbContext context,
        IUserContext userContext,
        IPublicMediaUrlResolver mediaUrls)
    {
        _context = context;
        _userContext = userContext;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<UniversalSearchResponse>> SearchAsync(UniversalSearchRequest request)
    {
        var query = request.Q.Trim();
        var lowered = query.ToLowerInvariant();
        var limit = request.LimitPerType <= 0 ? 8 : Math.Min(request.LimitPerType, 20);

        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var (widgetAccess, isSuperAdmin) = await GetAccessContextAsync(userId, orgId);
        var requestedTypes = ResolveRequestedTypes(request.Types);
        var permittedTypes = isSuperAdmin
            ? requestedTypes
            : requestedTypes
                .Where(t => HasViewAccess(widgetAccess, t))
                .ToList();

        if (permittedTypes.Count == 0)
        {
            return new ServiceResponse<UniversalSearchResponse>(true, new UniversalSearchResponse
            {
                Query = query,
                Groups = []
            });
        }

        var searchTasks = permittedTypes.Select(type => type switch
        {
            SearchTypes.Users => SearchUsersAsync(orgId, lowered, limit),
            SearchTypes.Rooms => SearchRoomsAsync(orgId, lowered, limit),
            SearchTypes.News => SearchNewsAsync(orgId, lowered, limit),
            SearchTypes.Tasks => SearchTasksAsync(orgId, userId, lowered, limit),
            SearchTypes.Schedule => SearchScheduleAsync(orgId, userId, lowered, limit),
            SearchTypes.Groups => SearchGroupsAsync(orgId, lowered, limit),
            SearchTypes.Grades => SearchGradesAsync(orgId, userId, lowered, limit),
            _ => Task.FromResult<SearchResultGroupDto?>(null)
        }).ToArray();

        var results = await Task.WhenAll(searchTasks);
        var groups = results
            .Where(g => g != null && g.Items.Count > 0)
            .Select(g => g!)
            .ToList();

        return new ServiceResponse<UniversalSearchResponse>(true, new UniversalSearchResponse
        {
            Query = query,
            Groups = groups
        });
    }

    private static List<string> ResolveRequestedTypes(List<string>? types)
    {
        if (types == null || types.Count == 0)
            return SearchTypes.All.ToList();

        return types
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => SearchTypes.All.Contains(t, StringComparer.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool HasViewAccess(Dictionary<string, string> widgetAccess, string searchType)
    {
        if (!TypeWidgetKeys.TryGetValue(searchType, out var widgetKey))
            return false;

        if (!widgetAccess.TryGetValue(widgetKey, out var level))
            return false;

        return level is "view" or "edit" or "admin";
    }

    private async Task<(Dictionary<string, string> WidgetAccess, bool IsSuperAdmin)> GetAccessContextAsync(
        Guid userId,
        Guid orgId)
    {
        var member = await _context.OrganizationMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.OrganizationId == orgId && m.IsActive)
            .Select(m => new { m.Role.Name, Permissions = m.Role.Permissions })
            .FirstOrDefaultAsync();

        if (member == null)
            return ([], false);

        var isSuperAdmin = member.Name is "SuperAdmin" or "Super Admin";
        var widgetAccess = member.Permissions.ToDictionary(
            p => p.WidgetKey,
            p => p.AccessLevel.ToString().ToLowerInvariant(),
            StringComparer.OrdinalIgnoreCase);

        return (widgetAccess, isSuperAdmin);
    }

    private async Task<SearchResultGroupDto?> SearchUsersAsync(Guid orgId, string lowered, int limit)
    {
        var baseQuery = (
            from m in _context.OrganizationMembers.AsNoTracking()
            join u in _context.Users.AsNoTracking() on m.UserId equals u.Id
            join r in _context.Roles.AsNoTracking() on m.RoleId equals r.Id
            where m.OrganizationId == orgId && m.IsActive && !u.IsDeleted
            select new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Title,
                u.AvatarUrl,
                u.Email,
                r.Name
            }).Where(x =>
            (x.FirstName ?? string.Empty).ToLower().Contains(lowered) ||
            (x.LastName ?? string.Empty).ToLower().Contains(lowered) ||
            (x.Email ?? string.Empty).ToLower().Contains(lowered) ||
            (x.Title ?? string.Empty).ToLower().Contains(lowered));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Take(limit)
            .ToListAsync();

        return BuildGroup(SearchTypes.Users, total, rows.Select(x => new SearchHitDto
        {
            Id = x.Id.ToString(),
            Type = SearchTypes.Users,
            Title = $"{x.FirstName} {x.LastName}".Trim(),
            Subtitle = string.IsNullOrWhiteSpace(x.Title) ? x.Name : x.Title,
            ImageUrl = _mediaUrls.ToPublicUrl(x.AvatarUrl),
            Route = $"/user-profile?id={x.Id}"
        }).ToList());
    }

    private async Task<SearchResultGroupDto?> SearchRoomsAsync(Guid orgId, string lowered, int limit)
    {
        var baseQuery = _context.Rooms
            .AsNoTracking()
            .Where(r => r.OrganizationId == orgId && !r.IsDeleted)
            .Where(r =>
                r.Name.ToLower().Contains(lowered) ||
                (r.Location ?? string.Empty).ToLower().Contains(lowered));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderBy(r => r.Name)
            .Take(limit)
            .Select(r => new { r.Id, r.Name, r.Location, r.Capacity })
            .ToListAsync();

        return BuildGroup(SearchTypes.Rooms, total, rows.Select(r => new SearchHitDto
        {
            Id = r.Id.ToString(),
            Type = SearchTypes.Rooms,
            Title = r.Name,
            Subtitle = string.IsNullOrWhiteSpace(r.Location)
                ? $"Capacity {r.Capacity}"
                : $"{r.Location} · {r.Capacity} seats",
            Route = "/rooms"
        }).ToList());
    }

    private async Task<SearchResultGroupDto?> SearchNewsAsync(Guid orgId, string lowered, int limit)
    {
        var baseQuery = _context.News
            .AsNoTracking()
            .Where(n => n.OrganizationId == orgId && !n.IsDeleted)
            .Where(n =>
                n.Title.ToLower().Contains(lowered) ||
                n.Content.ToLower().Contains(lowered));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new { n.Id, n.Title, n.Category, n.CoverImageUrl })
            .ToListAsync();

        return BuildGroup(SearchTypes.News, total, rows.Select(n => new SearchHitDto
        {
            Id = n.Id.ToString(),
            Type = SearchTypes.News,
            Title = n.Title,
            Subtitle = n.Category.ToString(),
            ImageUrl = _mediaUrls.ToPublicUrl(n.CoverImageUrl),
            Route = $"/news-article?id={n.Id}"
        }).ToList());
    }

    private async Task<SearchResultGroupDto?> SearchTasksAsync(Guid orgId, Guid userId, string lowered, int limit)
    {
        var baseQuery = _context.Tasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == orgId && !t.IsDeleted)
            .Where(t => t.AssigneeId == userId || t.CreatedByUserId == userId)
            .Where(t =>
                t.Title.ToLower().Contains(lowered) ||
                (t.Description ?? string.Empty).ToLower().Contains(lowered));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderByDescending(t => t.DueDate ?? t.CreatedAt)
            .Take(limit)
            .Select(t => new { t.Id, t.Title, t.DueDate, t.IsCompleted })
            .ToListAsync();

        return BuildGroup(SearchTypes.Tasks, total, rows.Select(t => new SearchHitDto
        {
            Id = t.Id.ToString(),
            Type = SearchTypes.Tasks,
            Title = t.Title,
            Subtitle = t.IsCompleted
                ? "Completed"
                : t.DueDate.HasValue
                    ? $"Due {t.DueDate.Value:MMM d, yyyy}"
                    : "No due date",
            Route = "/tasks"
        }).ToList());
    }

    private async Task<SearchResultGroupDto?> SearchScheduleAsync(Guid orgId, Guid userId, string lowered, int limit)
    {
        var userGroupIds = await _context.Set<GroupMember>()
            .AsNoTracking()
            .Where(gm => gm.UserId == userId)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        var baseQuery = _context.Events
            .AsNoTracking()
            .Where(e => e.OrganizationId == orgId && !e.IsDeleted)
            .Where(e =>
                e.Title.ToLower().Contains(lowered) ||
                (e.Description ?? string.Empty).ToLower().Contains(lowered))
            .Where(e =>
                e.IsPublic ||
                e.HostId == userId ||
                (e.GroupId.HasValue && userGroupIds.Contains(e.GroupId.Value)) ||
                e.Attendances.Any(a => a.UserId == userId &&
                    (a.Status == AttendanceStatus.Added || a.Status == AttendanceStatus.Expected)));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderBy(e => e.StartTime)
            .Take(limit)
            .Select(e => new { e.Id, e.Title, e.StartTime, e.EndTime, RoomName = e.Room != null ? e.Room.Name : null })
            .ToListAsync();

        return BuildGroup(SearchTypes.Schedule, total, rows.Select(e => new SearchHitDto
        {
            Id = e.Id.ToString(),
            Type = SearchTypes.Schedule,
            Title = e.Title,
            Subtitle = string.IsNullOrWhiteSpace(e.RoomName)
                ? $"{e.StartTime:MMM d, h:mm tt} – {e.EndTime:h:mm tt}"
                : $"{e.StartTime:MMM d, h:mm tt} · {e.RoomName}",
            Route = "/schedule"
        }).ToList());
    }

    private async Task<SearchResultGroupDto?> SearchGroupsAsync(Guid orgId, string lowered, int limit)
    {
        var baseQuery = _context.Groups
            .AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted)
            .Where(g =>
                g.Name.ToLower().Contains(lowered) ||
                g.Type.ToLower().Contains(lowered));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderBy(g => g.Name)
            .Take(limit)
            .Select(g => new { g.Id, g.Name, g.Type })
            .ToListAsync();

        return BuildGroup(SearchTypes.Groups, total, rows.Select(g => new SearchHitDto
        {
            Id = g.Id.ToString(),
            Type = SearchTypes.Groups,
            Title = g.Name,
            Subtitle = g.Type,
            Route = "/users"
        }).ToList());
    }

    private async Task<SearchResultGroupDto?> SearchGradesAsync(Guid orgId, Guid userId, string lowered, int limit)
    {
        var baseQuery = _context.Grades
            .AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted && g.UserId == userId)
            .Where(g =>
                g.CourseName.ToLower().Contains(lowered) ||
                g.Semester.ToLower().Contains(lowered) ||
                (g.LetterGrade ?? string.Empty).ToLower().Contains(lowered));

        var total = await baseQuery.CountAsync();
        if (total == 0) return null;

        var rows = await baseQuery
            .OrderByDescending(g => g.Semester)
            .ThenBy(g => g.CourseName)
            .Take(limit)
            .Select(g => new { g.Id, g.CourseName, g.Semester, g.Score, g.LetterGrade })
            .ToListAsync();

        return BuildGroup(SearchTypes.Grades, total, rows.Select(g => new SearchHitDto
        {
            Id = g.Id.ToString(),
            Type = SearchTypes.Grades,
            Title = g.CourseName,
            Subtitle = string.IsNullOrWhiteSpace(g.LetterGrade)
                ? $"{g.Semester} · {g.Score:g}%"
                : $"{g.Semester} · {g.LetterGrade} ({g.Score:g}%)",
            Route = "/grades"
        }).ToList());
    }

    private SearchResultGroupDto BuildGroup(string type, int total, List<SearchHitDto> items) =>
        new()
        {
            Type = type,
            Label = TypeLabels.TryGetValue(type, out var label) ? label : type,
            TotalCount = total,
            Items = items
        };
}
