using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Omada.Api.Entities;

namespace Omada.Api.Infrastructure.Security;

public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
{
    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options) { }

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Check if the policy name follows the "widget:level" format
        var policyParts = policyName.Split(':');
        if (policyParts.Length == 2 && Enum.TryParse<AccessLevel>(policyParts[1], true, out var level))
        {
            var policy = new AuthorizationPolicyBuilder();
            // Add our custom requirement dynamically
            policy.AddRequirements(new PermissionRequirement(policyParts[0], level));
            return policy.Build();
        }

        // If it's not a permission policy, use the default behavior
        return await base.GetPolicyAsync(policyName);
    }
}