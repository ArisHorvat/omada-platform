/** Blocks auth layout from redirecting to dashboard while showing post-registration success. */
let completingRegistrationSuccess = false;

export function setCompletingRegistrationSuccess(value: boolean): void {
  completingRegistrationSuccess = value;
}

export function isCompletingRegistrationSuccess(): boolean {
  return completingRegistrationSuccess;
}
