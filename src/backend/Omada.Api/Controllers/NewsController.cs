using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.News;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;

    public NewsController(INewsService newsService)
    {
        _newsService = newsService;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<NewsItemDto>>>> GetAll(
        [FromQuery] PagedRequest request,
        [FromQuery] NewsType? type,
        [FromQuery] NewsCategory? category)
    {
        var response = await _newsService.GetNewsAsync(request, type, category);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<NewsItemDto>>> Create([FromBody] CreateNewsRequest request)
    {
        var response = await _newsService.CreateNewsAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpGet("/api/organizations/{orgId:guid}/widgets/news")]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<NewsItemDto>>>> GetWidgetNews(
        Guid orgId,
        [FromQuery] PagedRequest request)
    {
        var response = await _newsService.GetWidgetNewsAsync(orgId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)
            return Forbid();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("/api/organizations/{orgId:guid}/widgets/news")]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<NewsItemDto>>> CreateWidgetNews(
        Guid orgId,
        [FromBody] CreateNewsItemRequest request)
    {
        var response = await _newsService.CreateWidgetNewsAsync(orgId, request);
        if (!response.IsSuccess && response.Error?.Code == ErrorCodes.Forbidden)
            return Forbid();
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPost("/api/news/{id:guid}/read")]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<bool>>> MarkAsRead([FromRoute] Guid id)
    {
        var response = await _newsService.MarkNewsAsReadAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpPut("{id:guid}")]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<NewsItemDto>>> Update(Guid id, [FromBody] UpdateNewsRequest request)
    {
        var response = await _newsService.UpdateNewsAsync(id, request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(WidgetKeys.News, nameof(AccessLevel.Admin))]
    public async Task<ActionResult<ServiceResponse<bool>>> Delete(Guid id)
    {
        var response = await _newsService.DeleteNewsAsync(id);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}