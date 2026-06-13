export function bumpOnboardingStep(current: number | undefined, targetStep: number): number {
  return Math.max(current ?? 0, targetStep);
}

export function markOnboardingStepComplete(
  current: string[] | undefined | null,
  stepId: string,
): string[] {
  const next = new Set((current ?? []).map((s) => s.toLowerCase()));
  next.add(stepId.toLowerCase());
  return Array.from(next);
}

export function mergeCompletedOnboardingSteps(
  current: string[] | undefined | null,
  stepIds: string[],
): string[] {
  const next = new Set((current ?? []).map((s) => s.toLowerCase()));
  stepIds.forEach((id) => next.add(id.toLowerCase()));
  return Array.from(next);
}
