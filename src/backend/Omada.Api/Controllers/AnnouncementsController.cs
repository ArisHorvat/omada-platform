using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Announcements;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/announcements")]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;

    public AnnouncementsController(IAnnouncementService announcementService)
    {
        _announcementService = announcementService;
    }

    [HttpGet("channels")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<List<AnnouncementChannelDto>>>> GetChannels(
        CancellationToken cancellationToken)
    {
        var response = await _announcementService.GetAccessibleChannelsAsync(cancellationToken);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpGet("feed")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<AnnouncementPostDto>>>> GetFeed(
        [FromQuery] PagedRequest request)
    {
        var response = await _announcementService.GetFeedAsync(request);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpGet("channels/{channelId:guid}/posts")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<AnnouncementPostDto>>>> GetChannelPosts(
        Guid channelId,
        [FromQuery] PagedRequest request)
    {
        var response = await _announcementService.GetChannelPostsAsync(channelId, request);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return StatusCode(500, response);
    }

    [HttpPost("channels/{channelId:guid}/posts")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<AnnouncementPostDto>>> CreatePost(
        Guid channelId,
        [FromBody] CreateAnnouncementPostRequest request)
    {
        var response = await _announcementService.CreatePostAsync(channelId, request);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return BadRequest(response);
    }

    [HttpGet("posts/{postId:guid}/comments")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<List<AnnouncementCommentDto>>>> GetComments(Guid postId)
    {
        var response = await _announcementService.GetPostCommentsAsync(postId);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return StatusCode(500, response);
    }

    [HttpPost("posts/{postId:guid}/comments")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<AnnouncementCommentDto>>> CreateComment(
        Guid postId,
        [FromBody] CreateAnnouncementCommentRequest request)
    {
        var response = await _announcementService.CreateCommentAsync(postId, request);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return BadRequest(response);
    }

    [HttpPost("channels/{channelId:guid}/read")]
    [HasPermission(WidgetKeys.Announcements, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<bool>>> MarkChannelRead(Guid channelId)
    {
        var response = await _announcementService.MarkChannelReadAsync(channelId);
        if (response.IsSuccess)
            return Ok(response);

        if (response.Error?.Code == ErrorCodes.NotFound)
            return NotFound(response);
        if (response.Error?.Code == ErrorCodes.Forbidden)
            return StatusCode(403, response);

        return StatusCode(500, response);
    }
}
