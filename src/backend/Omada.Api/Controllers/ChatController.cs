using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Chat;
using Omada.Api.Entities;
using Omada.Api.Repositories;
using Omada.Api.WebSocketHandlers;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/organizations/{organizationId}/chat")]
public class ChatController : ControllerBase
{
    private readonly IMessageRepository _repository;
    private readonly IWebSocketHandler _webSocketHandler;

    public ChatController(IMessageRepository repository, IWebSocketHandler webSocketHandler)
    {
        _repository = repository;
        _webSocketHandler = webSocketHandler;
    }

    [HttpGet]
    public async Task<IActionResult> GetRecent(Guid organizationId)
    {
        var messages = await _repository.GetRecentAsync(organizationId);
        return Ok(messages.OrderBy(m => m.CreatedAt)); // Return oldest first for UI
    }

    [HttpPost]
    public async Task<IActionResult> Send(Guid organizationId, [FromBody] CreateMessageRequest request)
    {
        try 
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            // In a real app, fetch user name from DB or claims. Assuming passed or simplified here.
            var userName = request.UserName ?? "Anonymous"; 

            var message = new Message
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                UserId = userId,
                UserName = userName,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(message);
            await _webSocketHandler.BroadcastAsync(new { type = "chat_message", data = message }, organizationId);

            return Ok(new ServiceResponse<Message>(true, message));
        }
        catch (UnauthorizedAccessException)
        {
            var error = new AppError(ErrorCodes.Unauthorized, "Your session has expired.");
            return Unauthorized(new ServiceResponse(false, error));
        }
        catch (Exception ex)
        {
            var error = new AppError(ErrorCodes.InternalError, ex.Message);
            return StatusCode(500, new ServiceResponse(false, error));
        }
    }
}

