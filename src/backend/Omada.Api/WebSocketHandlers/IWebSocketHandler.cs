using System.Net.WebSockets;

namespace Omada.Api.WebSocketHandlers;

public interface IWebSocketHandler
{
    Task HandleAsync(WebSocket webSocket);
    Task BroadcastAsync(object message);
}
