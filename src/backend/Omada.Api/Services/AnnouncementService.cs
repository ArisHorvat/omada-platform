using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Announcements;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Hubs;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Security;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly IHubContext<AppHub> _hubContext;
    private readonly IPublicMediaUrlResolver _mediaUrls;
    private readonly IGroupScopeService _groupScope;

    public AnnouncementService(
        ApplicationDbContext context,
        IUnitOfWork uow,
        IUserContext userContext,
        IHubContext<AppHub> hubContext,
        IPublicMediaUrlResolver mediaUrls,
        IGroupScopeService groupScope)
    {
        _context = context;
        _uow = uow;
        _userContext = userContext;
        _hubContext = hubContext;
        _mediaUrls = mediaUrls;
        _groupScope = groupScope;
    }

    public async Task<ServiceResponse<List<AnnouncementChannelDto>>> GetAccessibleChannelsAsync(
        CancellationToken cancellationToken = default)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var groupIds = await GetUserGroupIdsAsync(orgId, userId);

        var enrolledOfferingIds = await _context.OfferingEnrollments.AsNoTracking()
            .Where(e => e.UserId == userId && !e.IsDeleted)
            .Select(e => e.OfferingId)
            .ToListAsync(cancellationToken);

        var teachingOfferingIds = await OfferingTeachingAuthorization.GetTeachingOfferingIdsAsync(
            _context, orgId, userId);

        var offeringIds = enrolledOfferingIds.Concat(teachingOfferingIds).Distinct().ToList();

        await EnsureChannelsProvisionedAsync(orgId, groupIds, offeringIds, cancellationToken);

        var channels = await _context.AnnouncementChannels.AsNoTracking()
            .Where(c =>
                c.OrganizationId == orgId &&
                !c.IsDeleted &&
                (c.Kind == AnnouncementChannelKind.General ||
                 (c.Kind == AnnouncementChannelKind.Group &&
                  c.GroupId != null &&
                  groupIds.Contains(c.GroupId.Value)) ||
                 (c.Kind == AnnouncementChannelKind.CourseOffering &&
                  c.CourseOfferingId != null &&
                  offeringIds.Contains(c.CourseOfferingId.Value))))
            .OrderBy(c => c.Kind)
            .ThenBy(c => c.DisplayName)
            .ToListAsync(cancellationToken);

        var channelIds = channels.Select(c => c.Id).ToList();

        var readCursors = await _context.UserAnnouncementChannelReads.AsNoTracking()
            .Where(r => r.UserId == userId && r.OrganizationId == orgId && channelIds.Contains(r.ChannelId))
            .ToDictionaryAsync(r => r.ChannelId, r => r.LastReadAt, cancellationToken);

        var postMeta = await _context.AnnouncementPosts.AsNoTracking()
            .Where(p => channelIds.Contains(p.ChannelId) && !p.IsDeleted)
            .Select(p => new { p.ChannelId, p.CreatedAt, p.AuthorId })
            .ToListAsync(cancellationToken);

        var dtos = channels.Select(c =>
        {
            var hasReadCursor = readCursors.TryGetValue(c.Id, out var lastRead);
            var channelPosts = postMeta.Where(p => p.ChannelId == c.Id).ToList();
            var lastPostAt = channelPosts.Count == 0
                ? (DateTime?)null
                : channelPosts.Max(p => p.CreatedAt);

            var unread = channelPosts.Count(p =>
                p.AuthorId != userId &&
                (!hasReadCursor || p.CreatedAt > lastRead));

            return new AnnouncementChannelDto
            {
                Id = c.Id,
                Kind = c.Kind,
                Name = c.DisplayName,
                GroupId = c.GroupId,
                CourseOfferingId = c.CourseOfferingId,
                LastPostAt = lastPostAt,
                UnreadCount = unread
            };
        }).ToList();

        return new ServiceResponse<List<AnnouncementChannelDto>>(true, dtos);
    }

    public async Task<ServiceResponse<PagedResponse<AnnouncementPostDto>>> GetChannelPostsAsync(
        Guid channelId,
        PagedRequest request)
    {
        var access = await ResolveChannelAccessAsync(channelId);
        if (access.Error != null)
            return new ServiceResponse<PagedResponse<AnnouncementPostDto>>(false, null, access.Error);

        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 50 : Math.Min(request.PageSize, 100);

        var query = _context.AnnouncementPosts.AsNoTracking()
            .Where(p => p.ChannelId == channelId && !p.IsDeleted);

        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = await MapPostsAsync(posts, access.Channel!);
        items.Reverse();

        return new ServiceResponse<PagedResponse<AnnouncementPostDto>>(true, new PagedResponse<AnnouncementPostDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<PagedResponse<AnnouncementPostDto>>> GetFeedAsync(PagedRequest request)
    {
        var channelsResponse = await GetAccessibleChannelsAsync();
        if (!channelsResponse.IsSuccess || channelsResponse.Data == null)
            return new ServiceResponse<PagedResponse<AnnouncementPostDto>>(false, null, channelsResponse.Error);

        var channelIds = channelsResponse.Data.Select(c => c.Id).ToList();
        if (channelIds.Count == 0)
        {
            return new ServiceResponse<PagedResponse<AnnouncementPostDto>>(true, new PagedResponse<AnnouncementPostDto>
            {
                Items = new List<AnnouncementPostDto>(),
                TotalCount = 0,
                Page = 1,
                PageSize = request.PageSize <= 0 ? 30 : request.PageSize
            });
        }

        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 30 : Math.Min(request.PageSize, 100);

        var query = _context.AnnouncementPosts.AsNoTracking()
            .Include(p => p.Channel)
            .Where(p => channelIds.Contains(p.ChannelId) && !p.IsDeleted);

        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var postIds = posts.Select(p => p.Id).ToList();
        var commentCounts = await _context.AnnouncementComments.AsNoTracking()
            .Where(c => postIds.Contains(c.PostId) && !c.IsDeleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count);

        var authorIds = posts.Select(p => p.AuthorId).Distinct().ToList();
        var authors = await _context.Users.AsNoTracking()
            .Where(u => authorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}".Trim());

        var items = posts.Select(p =>
            MapPost(p, p.Channel, authors, commentCounts.GetValueOrDefault(p.Id))).ToList();

        return new ServiceResponse<PagedResponse<AnnouncementPostDto>>(true, new PagedResponse<AnnouncementPostDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ServiceResponse<AnnouncementPostDto>> CreatePostAsync(
        Guid channelId,
        CreateAnnouncementPostRequest request)
    {
        var access = await ResolveChannelAccessAsync(channelId);
        if (access.Error != null)
            return new ServiceResponse<AnnouncementPostDto>(false, null, access.Error);

        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        var author = await _uow.Repository<User>().GetByIdAsync(userId);
        if (author == null)
            return new ServiceResponse<AnnouncementPostDto>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var post = new AnnouncementPost
        {
            OrganizationId = orgId,
            ChannelId = channelId,
            AuthorId = userId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            CoverImageUrl = request.CoverImageUrl
        };

        await _uow.Repository<AnnouncementPost>().AddAsync(post);
        await _uow.CompleteAsync();

        var dto = MapPost(post, access.Channel!, new Dictionary<Guid, string>
        {
            [userId] = $"{author.FirstName} {author.LastName}".Trim()
        });

        await _hubContext.Clients.Group(orgId.ToString()).SendAsync(
            "announcement_post",
            new { type = "announcement_post", data = dto });

        return new ServiceResponse<AnnouncementPostDto>(true, dto);
    }

    public async Task<ServiceResponse<List<AnnouncementCommentDto>>> GetPostCommentsAsync(Guid postId)
    {
        var access = await ResolvePostAccessAsync(postId);
        if (access.Error != null)
            return new ServiceResponse<List<AnnouncementCommentDto>>(false, null, access.Error);

        var comments = await _context.AnnouncementComments.AsNoTracking()
            .Where(c => c.PostId == postId && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var authorIds = comments.Select(c => c.AuthorId).Distinct().ToList();
        var authors = await _context.Users.AsNoTracking()
            .Where(u => authorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}".Trim());

        var dtos = comments.Select(c => MapComment(c, authors)).ToList();
        return new ServiceResponse<List<AnnouncementCommentDto>>(true, dtos);
    }

    public async Task<ServiceResponse<AnnouncementCommentDto>> CreateCommentAsync(
        Guid postId,
        CreateAnnouncementCommentRequest request)
    {
        var access = await ResolvePostAccessAsync(postId);
        if (access.Error != null)
            return new ServiceResponse<AnnouncementCommentDto>(false, null, access.Error);

        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        var author = await _uow.Repository<User>().GetByIdAsync(userId);
        if (author == null)
            return new ServiceResponse<AnnouncementCommentDto>(false, null, new AppError(ErrorCodes.NotFound, "User not found"));

        var comment = new AnnouncementComment
        {
            OrganizationId = orgId,
            PostId = postId,
            AuthorId = userId,
            Content = request.Content.Trim()
        };

        await _uow.Repository<AnnouncementComment>().AddAsync(comment);
        await _uow.CompleteAsync();

        var dto = MapComment(comment, new Dictionary<Guid, string>
        {
            [userId] = $"{author.FirstName} {author.LastName}".Trim()
        });

        await _hubContext.Clients.Group(orgId.ToString()).SendAsync(
            "announcement_comment",
            new { type = "announcement_comment", data = dto });

        return new ServiceResponse<AnnouncementCommentDto>(true, dto);
    }

    public async Task<ServiceResponse<bool>> MarkChannelReadAsync(Guid channelId)
    {
        var access = await ResolveChannelAccessAsync(channelId);
        if (access.Error != null)
            return new ServiceResponse<bool>(false, false, access.Error);

        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        var now = DateTime.UtcNow;

        var existing = await _context.UserAnnouncementChannelReads
            .FirstOrDefaultAsync(r =>
                r.UserId == userId &&
                r.OrganizationId == orgId &&
                r.ChannelId == channelId &&
                !r.IsDeleted);

        if (existing == null)
        {
            await _uow.Repository<UserAnnouncementChannelRead>().AddAsync(new UserAnnouncementChannelRead
            {
                OrganizationId = orgId,
                UserId = userId,
                ChannelId = channelId,
                LastReadAt = now
            });
        }
        else if (existing.LastReadAt < now)
        {
            existing.LastReadAt = now;
        }

        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    /// <summary>
    /// Group ids the user may access in announcement channels: direct placement (membership,
    /// enrollment cohort, managed group) plus every ancestor up the tree — same rollup model as
    /// groups admin and schedule visibility. Does not expand to descendant/sibling groups.
    /// </summary>
    private async Task<List<Guid>> GetUserGroupIdsAsync(Guid orgId, Guid userId)
    {
        var expanded = await _groupScope.GetUserEffectiveGroupIdsAsync(orgId, userId);
        return expanded.ToList();
    }

    private async Task<List<Guid>> GetDirectUserGroupIdsAsync(Guid orgId, Guid userId)
    {
        var fromMembership = await _context.GroupMembers.AsNoTracking()
            .Where(gm => gm.UserId == userId && gm.Group.OrganizationId == orgId && !gm.Group.IsDeleted)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        var fromCohort = await _context.OfferingEnrollments.AsNoTracking()
            .Where(e =>
                e.UserId == userId &&
                e.OrganizationId == orgId &&
                !e.IsDeleted &&
                e.CohortGroupId != null)
            .Select(e => e.CohortGroupId!.Value)
            .ToListAsync();

        var fromManaged = await _context.Groups.AsNoTracking()
            .Where(g => g.OrganizationId == orgId && !g.IsDeleted && g.ManagerId == userId)
            .Select(g => g.Id)
            .ToListAsync();

        return fromMembership.Concat(fromCohort).Concat(fromManaged).Distinct().ToList();
    }

    private async Task<(AnnouncementPost? Post, AnnouncementChannel? Channel, AppError? Error)> ResolvePostAccessAsync(
        Guid postId)
    {
        var orgId = _userContext.OrganizationId;
        var post = await _context.AnnouncementPosts.AsNoTracking()
            .Include(p => p.Channel)
            .FirstOrDefaultAsync(p => p.Id == postId && p.OrganizationId == orgId && !p.IsDeleted);

        if (post?.Channel == null)
            return (null, null, new AppError(ErrorCodes.NotFound, "Announcement not found"));

        var channelAccess = await ResolveChannelAccessAsync(post.ChannelId);
        if (channelAccess.Error != null)
            return (null, null, channelAccess.Error);

        return (post, channelAccess.Channel, null);
    }

    private static AnnouncementCommentDto MapComment(
        AnnouncementComment comment,
        Dictionary<Guid, string> authors)
    {
        authors.TryGetValue(comment.AuthorId, out var authorName);
        return new AnnouncementCommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            AuthorId = comment.AuthorId,
            AuthorName = string.IsNullOrWhiteSpace(authorName) ? "Member" : authorName,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
    }

    /// <summary>
    /// Provisions missing channels in bulk (avoids per-group/per-offering round trips that timeout on slow SQL links).
    /// </summary>
    private async Task EnsureChannelsProvisionedAsync(
        Guid orgId,
        IReadOnlyList<Guid> groupIds,
        IReadOnlyList<Guid> offeringIds,
        CancellationToken cancellationToken)
    {
        var existing = await _context.AnnouncementChannels.AsNoTracking()
            .Where(c => c.OrganizationId == orgId && !c.IsDeleted)
            .Select(c => new { c.Kind, c.GroupId, c.CourseOfferingId })
            .ToListAsync(cancellationToken);

        var hasGeneral = existing.Any(c => c.Kind == AnnouncementChannelKind.General);
        if (!hasGeneral)
        {
            await _uow.Repository<AnnouncementChannel>().AddAsync(new AnnouncementChannel
            {
                OrganizationId = orgId,
                Kind = AnnouncementChannelKind.General,
                DisplayName = "General",
            });
        }

        var existingGroupIds = existing
            .Where(c => c.Kind == AnnouncementChannelKind.Group && c.GroupId.HasValue)
            .Select(c => c.GroupId!.Value)
            .ToHashSet();

        var missingGroupIds = groupIds.Where(id => !existingGroupIds.Contains(id)).Distinct().ToList();
        if (missingGroupIds.Count > 0)
        {
            var groups = await _context.Groups.AsNoTracking()
                .Where(g =>
                    g.OrganizationId == orgId &&
                    !g.IsDeleted &&
                    missingGroupIds.Contains(g.Id))
                .Select(g => new { g.Id, g.Name })
                .ToListAsync(cancellationToken);

            foreach (var group in groups)
            {
                await _uow.Repository<AnnouncementChannel>().AddAsync(new AnnouncementChannel
                {
                    OrganizationId = orgId,
                    Kind = AnnouncementChannelKind.Group,
                    GroupId = group.Id,
                    DisplayName = group.Name,
                });
            }
        }

        var existingOfferingIds = existing
            .Where(c => c.Kind == AnnouncementChannelKind.CourseOffering && c.CourseOfferingId.HasValue)
            .Select(c => c.CourseOfferingId!.Value)
            .ToHashSet();

        var missingOfferingIds = offeringIds.Where(id => !existingOfferingIds.Contains(id)).Distinct().ToList();
        if (missingOfferingIds.Count > 0)
        {
            var offerings = await _context.CourseOfferings.AsNoTracking()
                .Where(o =>
                    o.OrganizationId == orgId &&
                    !o.IsDeleted &&
                    missingOfferingIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Name, o.Code })
                .ToListAsync(cancellationToken);

            foreach (var offering in offerings)
            {
                var name = string.IsNullOrWhiteSpace(offering.Code)
                    ? offering.Name
                    : $"{offering.Name} ({offering.Code})";

                await _uow.Repository<AnnouncementChannel>().AddAsync(new AnnouncementChannel
                {
                    OrganizationId = orgId,
                    Kind = AnnouncementChannelKind.CourseOffering,
                    CourseOfferingId = offering.Id,
                    DisplayName = name,
                });
            }
        }

        await _uow.CompleteAsync();
    }

    private async Task<(AnnouncementChannel? Channel, AppError? Error)> ResolveChannelAccessAsync(Guid channelId)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;

        var channel = await _context.AnnouncementChannels.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == channelId && c.OrganizationId == orgId && !c.IsDeleted);

        if (channel == null)
            return (null, new AppError(ErrorCodes.NotFound, "Channel not found"));

        switch (channel.Kind)
        {
            case AnnouncementChannelKind.General:
                return (channel, null);

            case AnnouncementChannelKind.Group when channel.GroupId.HasValue:
            {
                var groupIds = await GetUserGroupIdsAsync(orgId, userId);
                if (!groupIds.Contains(channel.GroupId.Value))
                    return (null, new AppError(ErrorCodes.Forbidden, "You are not a member of this group channel."));
                return (channel, null);
            }

            case AnnouncementChannelKind.CourseOffering when channel.CourseOfferingId.HasValue:
            {
                var offeringId = channel.CourseOfferingId.Value;
                var enrolled = await _context.OfferingEnrollments.AsNoTracking()
                    .AnyAsync(e =>
                        e.OfferingId == offeringId &&
                        e.UserId == userId &&
                        !e.IsDeleted);

                if (enrolled)
                    return (channel, null);

                var canTeach = await OfferingTeachingAuthorization.CanTeachOfferingAsync(
                    _context, orgId, userId, offeringId);
                if (canTeach)
                    return (channel, null);

                return (null, new AppError(ErrorCodes.Forbidden, "You do not have access to this course channel."));
            }

            default:
                return (null, new AppError(ErrorCodes.Forbidden, "Channel access denied."));
        }
    }

    private async Task<List<AnnouncementPostDto>> MapPostsAsync(
        List<AnnouncementPost> posts,
        AnnouncementChannel channel)
    {
        if (posts.Count == 0)
            return new List<AnnouncementPostDto>();

        var postIds = posts.Select(p => p.Id).ToList();
        var commentCounts = await _context.AnnouncementComments.AsNoTracking()
            .Where(c => postIds.Contains(c.PostId) && !c.IsDeleted)
            .GroupBy(c => c.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count);

        var authorIds = posts.Select(p => p.AuthorId).Distinct().ToList();
        var authors = await _context.Users.AsNoTracking()
            .Where(u => authorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}".Trim());

        return posts.Select(p => MapPost(p, channel, authors, commentCounts.GetValueOrDefault(p.Id))).ToList();
    }

    private AnnouncementPostDto MapPost(
        AnnouncementPost post,
        AnnouncementChannel channel,
        Dictionary<Guid, string> authors,
        int commentCount = 0)
    {
        authors.TryGetValue(post.AuthorId, out var authorName);
        return new AnnouncementPostDto
        {
            Id = post.Id,
            ChannelId = post.ChannelId,
            ChannelKind = channel.Kind,
            ChannelName = channel.DisplayName,
            AuthorId = post.AuthorId,
            AuthorName = string.IsNullOrWhiteSpace(authorName) ? "Member" : authorName,
            Title = post.Title,
            Content = post.Content,
            CoverImageUrl = _mediaUrls.ToPublicUrl(
                string.IsNullOrEmpty(post.CoverImageUrl) ? null : post.CoverImageUrl),
            CreatedAt = post.CreatedAt,
            CommentCount = commentCount
        };
    }
}
