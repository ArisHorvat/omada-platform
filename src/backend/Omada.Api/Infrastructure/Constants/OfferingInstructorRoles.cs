namespace Omada.Api.Infrastructure.Constants;

public static class OfferingInstructorRoles
{
    public const string Primary = "primary";
    public const string CoInstructor = "co_instructor";

    public static string Normalize(string? role) =>
        string.Equals(role, Primary, StringComparison.OrdinalIgnoreCase) ? Primary : CoInstructor;
}
