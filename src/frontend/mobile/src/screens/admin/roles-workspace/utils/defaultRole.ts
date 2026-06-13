type RoleLike = { id?: string; name?: string };

export const HOLDING_ROLE_UNASSIGNED = 'Unassigned';
export const HOLDING_ROLE_MEMBER = 'Member';

export type HoldingRoleTarget = {
  name: string;
  id?: string;
  willBeCreated: boolean;
};

/** Mirrors backend holding-role resolution when a custom role is deleted. */
export function resolveHoldingRoleOnDelete(
  roles: RoleLike[],
  excludeRoleId?: string | null,
): HoldingRoleTarget {
  const candidates = roles.filter(
    (r) => r.id && r.name && r.id !== excludeRoleId && r.name.toLowerCase() !== 'admin',
  );

  const unassigned = candidates.find((r) => r.name!.toLowerCase() === HOLDING_ROLE_UNASSIGNED.toLowerCase());
  if (unassigned?.name) {
    return { id: unassigned.id, name: unassigned.name, willBeCreated: false };
  }

  const member = candidates.find((r) => r.name!.toLowerCase() === HOLDING_ROLE_MEMBER.toLowerCase());
  if (member?.name) {
    return { id: member.id, name: member.name, willBeCreated: false };
  }

  const deletingUnassigned = roles.some(
    (r) => r.id === excludeRoleId && r.name?.toLowerCase() === HOLDING_ROLE_UNASSIGNED.toLowerCase(),
  );

  return {
    name: deletingUnassigned ? HOLDING_ROLE_MEMBER : HOLDING_ROLE_UNASSIGNED,
    willBeCreated: true,
  };
}
