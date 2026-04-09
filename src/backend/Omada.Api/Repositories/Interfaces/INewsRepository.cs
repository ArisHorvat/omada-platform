using Omada.Api.DTOs.Common;
using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

public interface INewsRepository : IGenericRepository<NewsItem>
{
    Task<PagedResponse<NewsItem>> GetPagedByOrganizationAsync(Guid organizationId, int page, int pageSize);
    Task<PagedResponse<NewsItem>> GetUnreadPagedByOrganizationAsync(Guid organizationId, Guid userId, int page, int pageSize);
    Task<NewsItem?> GetByIdWithAuthorAsync(Guid id, Guid organizationId);
}
