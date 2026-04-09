using System.Linq.Expressions;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.News;
using Omada.Api.Entities;
using Omada.Api.Hubs;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;
using Omada.Api.Infrastructure;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Omada.Api.Services;

public class NewsService : INewsService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;
    private readonly ITenantAccessor _tenantAccessor;
    private readonly INewsRepository _newsRepository;
    private readonly IHubContext<AppHub> _hubContext;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public NewsService(
        IUnitOfWork uow,
        IUserContext userContext,
        ITenantAccessor tenantAccessor,
        INewsRepository newsRepository,
        IHubContext<AppHub> hubContext,
        IPublicMediaUrlResolver mediaUrls)
    {
        _uow = uow;
        _userContext = userContext;
        _tenantAccessor = tenantAccessor;
        _newsRepository = newsRepository;
        _hubContext = hubContext;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<PagedResponse<NewsItemDto>>> GetNewsAsync(
        PagedRequest request,
        NewsType? type = null,
        NewsCategory? category = null)
    {
        Expression<Func<NewsItem, bool>>? predicate = null;
        if (type.HasValue && category.HasValue)
            predicate = n => n.Type == type.Value && n.Category == category.Value;
        else if (type.HasValue)
            predicate = n => n.Type == type.Value;
        else if (category.HasValue)
            predicate = n => n.Category == category.Value;

        // Tenant scope: global query filter (ApplicationDbContext) + IUserContext on controller
        var pagedNews = await _uow.Repository<NewsItem>().GetPagedAsync(
            request.Page,
            request.PageSize,
            predicate: predicate,
            orderBy: q => q.OrderByDescending(n => n.CreatedAt)
        );

        // 2. Extract unique Author IDs and fetch the Users manually
        var authorIds = pagedNews.Items.Select(n => n.AuthorId).Distinct().ToList();
        var authors = await _uow.Repository<User>().FindAsync(u => authorIds.Contains(u.Id));
        var authorDictionary = authors.ToDictionary(u => u.Id, u => $"{u.FirstName} {u.LastName}");

        // 3. Map to DTOs using the dictionary we just built
        var dtos = pagedNews.Items.Select(n => new NewsItemDto {
            Id = n.Id, 
            Title = n.Title, 
            Content = n.Content, 
            Type = n.Type, 
            Category = n.Category,
            CoverImageUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(n.CoverImageUrl) ? null : n.CoverImageUrl),
            CreatedAt = n.CreatedAt,
            // Fallback to "Unknown" just in case a user was deleted
            AuthorName = authorDictionary.ContainsKey(n.AuthorId) ? authorDictionary[n.AuthorId] : "Unknown" 
        }).ToList();

        // 4. Initialize PagedResponse without a constructor
        var response = new PagedResponse<NewsItemDto> 
        {
            Items = dtos,
            TotalCount = pagedNews.TotalCount,
            Page = pagedNews.Page,
            PageSize = pagedNews.PageSize
        };

        return new ServiceResponse<PagedResponse<NewsItemDto>>(true, response);
    }

    public async Task<ServiceResponse<NewsItemDto>> CreateNewsAsync(CreateNewsRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var userId = _userContext.UserId;
        
        // Fetch the author so we can return their name instantly to the UI
        var author = await _uow.Repository<User>().GetByIdAsync(userId);

        var news = new NewsItem { 
            OrganizationId = orgId, 
            AuthorId = userId, 
            Title = request.Title, 
            Content = request.Content, 
            Type = request.Type, 
            Category = request.Category,
            CoverImageUrl = request.CoverImageUrl 
        };
        
        await _uow.Repository<NewsItem>().AddAsync(news);
        await _uow.CompleteAsync();

        return new ServiceResponse<NewsItemDto>(true, new NewsItemDto { 
            Id = news.Id, 
            Title = news.Title, 
            Content = news.Content, 
            Type = news.Type, 
            Category = news.Category,
            CoverImageUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(news.CoverImageUrl) ? null : news.CoverImageUrl),
            CreatedAt = news.CreatedAt, 
            AuthorName = $"{author?.FirstName} {author?.LastName}"
        });
    }

    public async Task<ServiceResponse<PagedResponse<NewsItemDto>>> GetWidgetNewsAsync(Guid orgId, PagedRequest request)
    {
        if (!CanAccessOrganization(orgId))
            return new ServiceResponse<PagedResponse<NewsItemDto>>(false, null, new AppError(ErrorCodes.Forbidden, "Cross-tenant access denied."));

        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 100);
        var userId = _userContext.UserId;
        var paged = await _newsRepository.GetUnreadPagedByOrganizationAsync(orgId, userId, page, pageSize);

        var result = new PagedResponse<NewsItemDto>
        {
            Items = paged.Items.Select(MapToDto).ToList(),
            TotalCount = paged.TotalCount,
            Page = paged.Page,
            PageSize = paged.PageSize
        };

        return new ServiceResponse<PagedResponse<NewsItemDto>>(true, result);
    }

    public async Task<ServiceResponse<NewsItemDto>> CreateWidgetNewsAsync(Guid orgId, CreateNewsItemRequest request)
    {
        if (!CanAccessOrganization(orgId))
            return new ServiceResponse<NewsItemDto>(false, null, new AppError(ErrorCodes.Forbidden, "Cross-tenant access denied."));

        var userId = _userContext.UserId;
        var item = new NewsItem
        {
            OrganizationId = orgId,
            AuthorId = userId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            CoverImageUrl = request.CoverImageUrl,
            Type = request.Type,
            Category = request.Category
        };

        await _newsRepository.AddAsync(item);
        await _uow.CompleteAsync();

        var author = await _uow.Repository<User>().GetByIdAsync(userId);
        var dto = MapToDto(item);
        if (author != null)
            dto.AuthorName = $"{author.FirstName} {author.LastName}";

        // Broadcast to all clients subscribed to this organization group.
        await _hubContext.Clients.Group(orgId.ToString()).SendAsync(
            "NewsPublished",
            new { id = dto.Id, title = dto.Title, createdAt = dto.CreatedAt });

        return new ServiceResponse<NewsItemDto>(true, dto);
    }

    public async Task<ServiceResponse<bool>> MarkNewsAsReadAsync(Guid newsId)
    {
        // Tenant scope: enforce that the read record can only be created for the current tenant.
        var orgId = _tenantAccessor.CurrentOrganizationId;
        if (!orgId.HasValue)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.Forbidden, "Cross-tenant access denied."));

        // Will be filtered by the tenant query filter (ApplicationDbContext) automatically.
        var news = await _uow.Repository<NewsItem>().GetByIdAsync(newsId);
        if (news == null)
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "News post not found."));

        var userId = _userContext.UserId;

        var alreadyRead = await _uow.Repository<UserNewsRead>()
            .GetQueryable()
            .AnyAsync(r => r.UserId == userId && r.NewsItemId == newsId);

        if (!alreadyRead)
        {
            await _uow.Repository<UserNewsRead>().AddAsync(new UserNewsRead
            {
                UserId = userId,
                NewsItemId = newsId,
                ReadAt = DateTime.UtcNow
            });

            await _uow.CompleteAsync();
        }

        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<NewsItemDto>> UpdateNewsAsync(Guid id, UpdateNewsRequest request)
    {
        // Find the specific news item (tenant filter on DbContext)
        var news = (await _uow.Repository<NewsItem>().FindAsync(n => n.Id == id)).FirstOrDefault();

        if (news == null)
            return new ServiceResponse<NewsItemDto>(false, null, new AppError(ErrorCodes.NotFound, "News post not found"));

        // Update properties
        news.Title = request.Title;
        news.Content = request.Content;
        news.Type = request.Type;
        news.Category = request.Category;
        news.CoverImageUrl = request.CoverImageUrl;

        _uow.Repository<NewsItem>().Update(news);
        await _uow.CompleteAsync();

        // Fetch the author's name to return the complete DTO to the frontend
        var author = await _uow.Repository<User>().GetByIdAsync(news.AuthorId);

        return new ServiceResponse<NewsItemDto>(true, new NewsItemDto { 
            Id = news.Id, 
            Title = news.Title, 
            Content = news.Content, 
            Type = news.Type, 
            Category = news.Category,
            CoverImageUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(news.CoverImageUrl) ? null : news.CoverImageUrl),
            CreatedAt = news.CreatedAt, 
            AuthorName = author != null ? $"{author.FirstName} {author.LastName}" : "Unknown"
        });
    }

    public async Task<ServiceResponse<bool>> DeleteNewsAsync(Guid id)
    {
        var news = (await _uow.Repository<NewsItem>().FindAsync(n => n.Id == id)).FirstOrDefault();
        if (news == null) return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "News post not found"));

        _uow.Repository<NewsItem>().Remove(news);
        await _uow.CompleteAsync();
        return new ServiceResponse<bool>(true, true);
    }

    private bool CanAccessOrganization(Guid orgId)
    {
        var tenantOrgId = _tenantAccessor.CurrentOrganizationId;
        return tenantOrgId.HasValue && tenantOrgId.Value == orgId;
    }

    private NewsItemDto MapToDto(NewsItem n)
    {
        return new NewsItemDto
        {
            Id = n.Id,
            Title = n.Title,
            Content = n.Content,
            Type = n.Type,
            Category = n.Category,
            CoverImageUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(n.CoverImageUrl) ? null : n.CoverImageUrl),
            CreatedAt = n.CreatedAt,
            AuthorName = n.Author != null ? $"{n.Author.FirstName} {n.Author.LastName}" : "Unknown"
        };
    }
}