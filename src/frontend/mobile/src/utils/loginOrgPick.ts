/** Blocks auth layout from redirecting to dashboard while finishing post-login org selection. */
let completingLoginOrgPick = false;

export function setCompletingLoginOrgPick(value: boolean): void {
  completingLoginOrgPick = value;
}

export function isCompletingLoginOrgPick(): boolean {
  return completingLoginOrgPick;
}
