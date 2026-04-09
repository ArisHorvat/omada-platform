using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Chat;
using Omada.Api.DTOs.Common;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/organizations/{organizationId}/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Chat, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<PagedResponse<MessageDto>>>> GetRecent([FromQuery] PagedRequest request)
    {
        var response = await _chatService.GetRecentMessagesAsync(request);
        return response.IsSuccess ? Ok(response) : StatusCode(500, response);
    }

    [HttpPost]
    [HasPermission(WidgetKeys.Chat, nameof(AccessLevel.Edit))]
    public async Task<ActionResult<ServiceResponse<MessageDto>>> Send([FromBody] CreateMessageRequest request)
    {
        var response = await _chatService.SendMessageAsync(request);

        if (response.IsSuccess)
        {
            // Broadcast the newly created message to connected clients
            return Ok(response);
        }

        return BadRequest(response);
    }
}