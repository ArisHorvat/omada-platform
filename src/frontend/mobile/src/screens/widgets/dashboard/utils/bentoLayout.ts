/**
 * Pairs small bento cells two-per-row; a lone trailing small spans full width (wide)
 * so the grid never leaves a half-row empty.
 */
export type BentoEffectiveSize = 'small' | 'wide' | 'large';

export interface BentoLayoutItem {
  id: string;
  effectiveSize: BentoEffectiveSize;
}

export function computeBentoLayout(
  favorites: string[],
  definitions: Record<string, { defaultSize?: BentoEffectiveSize } | undefined>
): BentoLayoutItem[] {
  const out: BentoLayoutItem[] = [];
  let i = 0;

  while (i < favorites.length) {
    const id = favorites[i];
    const def = definitions[id];
    if (!def) {
      i += 1;
      continue;
    }

    const natural = def.defaultSize ?? 'small';
    const isNaturalWide = natural === 'wide' || natural === 'large';

    if (isNaturalWide) {
      out.push({ id, effectiveSize: natural });
      i += 1;
      continue;
    }

    const nextId = favorites[i + 1];
    const nextDef = nextId ? definitions[nextId] : undefined;
    const nextNatural = nextDef?.defaultSize ?? 'small';
    const nextIsWide = nextNatural === 'wide' || nextNatural === 'large';

    if (nextId && nextDef && !nextIsWide) {
      out.push({ id, effectiveSize: 'small' });
      out.push({ id: nextId, effectiveSize: 'small' });
      i += 2;
    } else {
      out.push({ id, effectiveSize: 'wide' });
      i += 1;
    }
  }

  return out;
}
