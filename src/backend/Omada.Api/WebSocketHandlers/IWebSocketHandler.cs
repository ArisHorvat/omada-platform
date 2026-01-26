using System.Net.WebSockets;

namespace Omada.Api.WebSocketHandlers;

public interface IWebSocketHandler
{
    Task HandleAsync(WebSocket webSocket, Guid organizationId);
    Task BroadcastAsync(object message, Guid organizationId);
}
