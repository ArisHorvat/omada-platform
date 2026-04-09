using Microsoft.AspNetCore.Authorization;

namespace Omada.Api.Abstractions;

/// <summary>
/// Requires authorization policy <c>{widgetKey}:{AccessLevel}</c>, e.g. <c>news:View</c>.
/// Use <c>Omada.Api.Infrastructure.WidgetKeys</c> and <c>nameof(AccessLevel.View|Edit|Admin)</c> at call sites.
/// </summary>
public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string widgetKey, string accessLevelName) : base(policy: $"{widgetKey}:{accessLevelName}")
    {
    }
}