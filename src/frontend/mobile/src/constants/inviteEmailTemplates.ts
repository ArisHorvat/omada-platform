export function memberInvitationEmailPreview(
  firstName: string,
  orgName: string,
  inviteLink: string,
  _inviteCode: string,
): string {
  return `Subject: You're invited to join ${orgName} on Omada

Hi ${firstName},

${orgName} has invited you to Omada.

Open this link to get started:
${inviteLink}

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
