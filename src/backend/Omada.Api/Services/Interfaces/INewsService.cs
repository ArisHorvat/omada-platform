using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.News;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface INewsService 
{
    Task<ServiceResponse<PagedResponse<NewsItemDto>>> GetNewsAsync(PagedRequest request, NewsType? type = null, NewsCategory? category = null);
    Task<ServiceResponse<PagedResponse<NewsItemDto>>> GetWidgetNewsAsync(Guid orgId, PagedRequest request);
    Task<ServiceResponse<NewsItemDto>> CreateNewsAsync(CreateNewsRequest request);
    Task<ServiceResponse<NewsItemDto>> CreateWidgetNewsAsync(Guid orgId, CreateNewsItemRequest request);
    Task<ServiceResponse<NewsItemDto>> UpdateNewsAsync(Guid id, UpdateNewsRequest request);
    Task<ServiceResponse<bool>> MarkNewsAsReadAsync(Guid newsId);
    Task<ServiceResponse<bool>> DeleteNewsAsync(Guid id);
}