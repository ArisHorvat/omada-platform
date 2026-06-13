using Microsoft.AspNetCore.Authorization;

namespace Omada.Api.Infrastructure.Security;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequiresOrgAdminAttribute : AuthorizeAttribute
{
    public RequiresOrgAdminAttribute()
    {
        Policy = "OrgAdmin";
    }
}
