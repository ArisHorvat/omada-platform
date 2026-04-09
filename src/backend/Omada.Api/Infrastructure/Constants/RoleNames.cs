namespace Omada.Api.Infrastructure;

public static class RoleNames
{
    // We ONLY hardcode Admin because it's required for the fallback safety net.
    // All other roles (Student, Dean, Manager) are purely dynamic data in the DB!
    public const string Admin = "Admin";
}
