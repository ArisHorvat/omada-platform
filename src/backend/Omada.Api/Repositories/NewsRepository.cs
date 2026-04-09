using Microsoft.EntityFrameworkCore;
using Omada.Api.Data;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class NewsRepository : GenericRepository<NewsItem>, INewsRepository
{
    public NewsRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResponse<NewsItem>> GetPagedByOrganizationAsync(Guid organizationId, int page, int pageSize)
    {
        var query = _context.News
            .AsNoTracking()
            .Where(n => n.OrganizationId == organizationId)
            .OrderByDescending(n => n.CreatedAt)
            .Include(n => n.Author);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<NewsItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResponse<NewsItem>> GetUnreadPagedByOrganizationAsync(Guid organizationId, Guid userId, int page, int pageSize)
    {
        // Unread = NewsItem rows that do NOT have a UserNewsRead row for this user.
        // Soft-delete is handled by ApplicationDbContext global query filter on UserNewsRead.
        var readNewsIds = _context.UserNewsReads
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .Select(r => r.NewsItemId);

        var query = _context.News
            .AsNoTracking()
            .Where(n => n.OrganizationId == organizationId)
            .Where(n => !readNewsIds.Contains(n.Id))
            .OrderByDescending(n => n.CreatedAt)
            .Include(n => n.Author);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<NewsItem>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<NewsItem?> GetByIdWithAuthorAsync(Guid id, Guid organizationId)
    {
        return await _context.News
            .AsNoTracking()
            .Where(n => n.Id == id && n.OrganizationId == organizationId)
            .Include(n => n.Author)
            .FirstOrDefaultAsync();
    }
}
