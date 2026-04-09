using Microsoft.AspNetCore.Authorization;
using Omada.Api.Entities;

namespace Omada.Api.Infrastructure.Security;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string WidgetKey { get; }
    public AccessLevel RequiredLevel { get; }

    public PermissionRequirement(string widgetKey, AccessLevel requiredLevel)
    {
        WidgetKey = widgetKey;
        RequiredLevel = requiredLevel;
    }
}
