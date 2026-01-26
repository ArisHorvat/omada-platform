using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace Omada.Api.WebSocketHandlers;

public class WebSocketHandler : IWebSocketHandler
{
    private readonly ConcurrentDictionary<string, (WebSocket Socket, Guid OrgId)> _sockets = new();
    private readonly ILogger<WebSocketHandler> _logger;

    public WebSocketHandler(ILogger<WebSocketHandler> logger)
    {
        _logger = logger;
    }

    public async Task HandleAsync(WebSocket webSocket, Guid organizationId)
    {
        var socketId = Guid.NewGuid().ToString();
        _sockets.TryAdd(socketId, (webSocket, organizationId));
        _logger.LogInformation("New WebSocket connection: {SocketId}", socketId);

        try
        {
            var buffer = new byte[1024 * 4];
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.LogInformation("WebSocket closed by client: {SocketId}", socketId);
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by client", CancellationToken.None);
                }
            }
        }
        catch
        {
            // Ignore errors
        }
        finally
        {
            _logger.LogInformation("Removing WebSocket connection: {SocketId}", socketId);
            _sockets.TryRemove(socketId, out _);
            if (webSocket.State != WebSocketState.Closed && webSocket.State != WebSocketState.Aborted)
            {
                try { await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed", CancellationToken.None); } catch { }
            }
            webSocket.Dispose();
        }
    }

    public async Task BroadcastAsync(object message, Guid organizationId)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        var json = JsonSerializer.Serialize(message, options);        
        var bytes = Encoding.UTF8.GetBytes(json);
        var buffer = new ArraySegment<byte>(bytes);

        var targets = _sockets.Values.Where(x => x.OrgId == organizationId).Select(x => x.Socket).ToList();
        _logger.LogInformation("Broadcasting message to {Count} clients in Org {OrgId}", targets.Count, organizationId);
        
        var tasks = new List<Task>();
        foreach (var socket in targets)
        {
            if (socket.State == WebSocketState.Open)
            {
                tasks.Add(socket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None));
            }
        }

        await Task.WhenAll(tasks);
    }
}
