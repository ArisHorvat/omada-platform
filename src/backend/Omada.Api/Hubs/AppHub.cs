using Microsoft.AspNetCore.SignalR;

namespace Omada.Api.Hubs;

public class AppHub : Hub
{
    // The frontend will call this as soon as it logs in and selects an organization
    public async Task JoinOrganization(Guid organizationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, organizationId.ToString());
    }

    public async Task LeaveOrganization(Guid organizationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, organizationId.ToString());
    }
}