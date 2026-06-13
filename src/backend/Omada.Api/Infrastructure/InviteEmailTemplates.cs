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

    public static (string Subject, string TextBody, string HtmlBody) TwoFactorSignInCode(string firstName, string code)
    {
        var subject = "Your Omada sign-in code";
        var textBody =
            $"""
            Hi {firstName},

            Use this code to finish signing in to Omada:

            {code}

            This code expires in 10 minutes. If you did not try to sign in, change your password and contact your admin.

            — Omada
            """;

        var htmlBody =
            $"""
            <html>
            <body style="font-family:sans-serif;line-height:1.6;color:#222;">
              <p>Hi {System.Net.WebUtility.HtmlEncode(firstName)},</p>
              <p>Use this code to finish signing in to Omada:</p>
              <p style="font-size:28px;font-weight:700;letter-spacing:0.25em;margin:24px 0;">{System.Net.WebUtility.HtmlEncode(code)}</p>
              <p>This code expires in 10 minutes. If you did not try to sign in, change your password and contact your admin.</p>
              <p>— Omada</p>
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

    public static (string Subject, string TextBody, string HtmlBody) PasswordReset(string firstName, string resetUrl)
    {
        var subject = "Reset your Omada password";
        var textBody =
            $"""
            Hi {firstName},

            We received a request to reset your Omada password.

            Open this link to choose a new password (valid for 1 hour):
            {resetUrl}

            If you did not request this, you can ignore this email.

            — Omada
            """;

        var htmlBody =
            $"""
            <html>
            <body style="font-family:sans-serif;line-height:1.6;color:#222;">
              <p>Hi {System.Net.WebUtility.HtmlEncode(firstName)},</p>
              <p>We received a request to reset your Omada password.</p>
              <p style="margin:24px 0;">
                <a href="{System.Net.WebUtility.HtmlEncode(resetUrl)}"
                   style="color:#2563eb;font-weight:600;text-decoration:underline;">
                  Reset your password
                </a>
              </p>
              <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
              <p>— Omada</p>
            </body>
            </html>
            """;

        return (subject, textBody, htmlBody);
    }

    public static string JoinWelcome(string firstName, string orgName) =>
        $"""
        Subject: Welcome to {orgName} on Omada

        Hi {firstName},

        Your account is set up and you're now a member of {orgName}.

        Open Omada and sign in to get started.

        — Omada
        """;
}
