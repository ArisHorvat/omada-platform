namespace Omada.Api.Infrastructure.Constants;

public static class RoleNames
{
    public const string Admin = "Admin";
    /// <summary>Generic holding role for open-code joins when no Unassigned role exists.</summary>
    public const string Member = "Member";
    /// <summary>Holding role when a custom role is deleted — not a substitute for Dean/Teacher/etc.</summary>
    public const string Unassigned = "Unassigned";
}
