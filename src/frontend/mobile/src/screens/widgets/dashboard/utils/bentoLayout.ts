/**
 * Pairs small bento cells two-per-row; a lone trailing small spans full width (wide)
 * so the grid never leaves a half-row empty.
 */
export type BentoEffectiveSize = 'small' | 'wide' | 'large';

export interface BentoLayoutItem {
  id: string;
  effectiveSize: BentoEffectiveSize;
}

export type BentoColumnCount = 2 | 3;

export function computeBentoLayout(
  favorites: string[],
  definitions: Record<string, { defaultSize?: BentoEffectiveSize } | undefined>,
  columns: BentoColumnCount = 2,
): BentoLayoutItem[] {
  const out: BentoLayoutItem[] = [];
  let i = 0;

  const isSmallNatural = (widgetId: string) => {
    const def = definitions[widgetId];
    if (!def) return false;
    const natural = def.defaultSize ?? 'small';
    return natural !== 'wide' && natural !== 'large';
  };

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

    if (columns === 3) {
      const smallBatch: string[] = [];
      let j = i;
      while (j < favorites.length && smallBatch.length < 3) {
        const batchId = favorites[j];
        if (!definitions[batchId] || !isSmallNatural(batchId)) break;
        smallBatch.push(batchId);
        j += 1;
      }

      if (smallBatch.length === 3) {
        smallBatch.forEach((sid) => out.push({ id: sid, effectiveSize: 'small' }));
        i += 3;
        continue;
      }
      if (smallBatch.length === 2) {
        smallBatch.forEach((sid) => out.push({ id: sid, effectiveSize: 'small' }));
        i += 2;
        continue;
      }
      out.push({ id, effectiveSize: 'wide' });
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
