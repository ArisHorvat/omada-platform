export function bumpOnboardingStep(current: number | undefined, targetStep: number): number {
  return Math.max(current ?? 0, targetStep);
}
