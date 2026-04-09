using Hangfire.Dashboard;

namespace Omada.Api.Infrastructure.Hangfire;

/// <summary>
/// Allows dashboard access without auth — restrict in production (e.g. IP allowlist or cookie auth).
/// </summary>
public sealed class HangfireDashboardNoAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context) => true;
}
