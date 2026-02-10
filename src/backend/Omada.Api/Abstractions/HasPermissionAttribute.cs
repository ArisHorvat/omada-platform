using Microsoft.AspNetCore.Authorization;

namespace Omada.Api.Abstractions;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string widget, string level) : base(policy: $"{widget}:{level}")
    {
    }
}