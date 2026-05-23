export function memberInvitationEmailPreview(
  firstName: string,
  orgName: string,
  inviteLink: string,
  inviteCode: string,
): string {
  return `Subject: You're invited to join ${orgName} on Omada

Hi ${firstName},

${orgName} has invited you to Omada.

Option 1 — Open your invite link:
${inviteLink}

Option 2 — Enter this organization code in the app:
${inviteCode}

If you already have an account, sign in and use "Join organization" with the code above.

Welcome aboard,
The Omada Team`;
}

export function adminOnboardingEmailPreview(
  adminFirstName: string,
  orgName: string,
  inviteLink: string,
  inviteCode: string,
): string {
  return `Subject: ${orgName} is ready on Omada — share invites with your team

Hi ${adminFirstName},

Your organization "${orgName}" was created successfully.

Share this link so people can register and join:
${inviteLink}

Or share this organization code:
${inviteCode}

You can also invite people by email from the Omada admin dashboard.

— Omada`;
}
