namespace Omada.Api.Infrastructure;

public static class InviteEmailTemplates
{
    public static (string Subject, string TextBody, string HtmlBody) MemberInvitation(
        string firstName,
        string orgName,
        string inviteUrl)
    {
        var subject = $"You're invited to join {orgName} on Omada";
        var textBody =
            $"""
            Hi {firstName},

            {orgName} has invited you to Omada.

            Open this link to get started:
            {inviteUrl}

            Welcome aboard,
            The Omada Team
            """;

        var htmlBody =
            $"""
            <html>
            <body style="font-family:sans-serif;line-height:1.6;color:#222;">
              <p>Hi {System.Net.WebUtility.HtmlEncode(firstName)},</p>
              <p>{System.Net.WebUtility.HtmlEncode(orgName)} has invited you to Omada.</p>
              <p style="margin:24px 0;">
                <a href="{System.Net.WebUtility.HtmlEncode(inviteUrl)}"
                   style="color:#2563eb;font-weight:600;text-decoration:underline;">
                  Join {System.Net.WebUtility.HtmlEncode(orgName)} on Omada
                </a>
              </p>
              <p>Welcome aboard,<br/>The Omada Team</p>
            </body>
            </html>
            """;

        return (subject, textBody, htmlBody);
    }

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
