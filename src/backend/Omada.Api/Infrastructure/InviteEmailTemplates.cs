namespace Omada.Api.Infrastructure;

public static class InviteEmailTemplates
{
    public static string MemberInvitation(string firstName, string orgName, string inviteLink, string inviteCode) =>
        $"""
        Subject: You're invited to join {orgName} on Omada

        Hi {firstName},

        {orgName} has invited you to Omada.

        Option 1 — Open your invite link:
        {inviteLink}

        Option 2 — Enter this organization code in the app:
        {inviteCode}

        If you already have an account, sign in and use "Join organization" with the code above.

        Welcome aboard,
        The Omada Team
        """;

    public static string AdminOnboarding(string adminFirstName, string orgName, string inviteLink, string inviteCode) =>
        $"""
        Subject: {orgName} is ready on Omada — share invites with your team

        Hi {adminFirstName},

        Your organization "{orgName}" was created successfully.

        Share this link so people can register and join:
        {inviteLink}

        Or share this organization code:
        {inviteCode}

        You can also invite people by email from the Omada admin dashboard.

        — Omada
        """;

    public static string JoinWelcome(string firstName, string orgName) =>
        $"""
        Subject: Welcome to {orgName} on Omada

        Hi {firstName},

        Your account is set up and you're now a member of {orgName}.

        Open Omada and sign in to get started.

        — Omada
        """;
}
