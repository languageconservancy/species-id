import { Species } from 'app/models/species.model';

function normalizeEnglish(nameEn: string): string {
  return nameEn.trim().toLowerCase();
}

function canExtendRun(run: Species[], next: Species): boolean {
  if (run.length === 0) {
    return false;
  }
  const prev: Species = run[run.length - 1];
  return (
    prev.id === next.id &&
    normalizeEnglish(prev.nameEn) === normalizeEnglish(next.nameEn) &&
    prev.nameScientific === next.nameScientific
  );
}

function uniqueLocalsPreservingOrder(locals: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const local of locals) {
    if (!local || seen.has(local)) {
      continue;
    }
    seen.add(local);
    out.push(local);
  }
  return out;
}

function finishRun(run: Species[]): Species {
  if (run.length === 1) {
    const copy = { ...run[0] } as Species;
    delete copy.mergedLocalNamesDisplay;
    return copy;
  }
  const locals = uniqueLocalsPreservingOrder(run.map((r) => r.nameLocal));
  const representative = run[0];
  return {
    ...representative,
    mergedLocalNamesDisplay: locals.join('; '),
  };
}

/**
 * Collapses consecutive list rows that refer to the same species (id), same English name,
 * and same scientific name, joining distinct local names with "; ".
 */
export function mergeAdjacentSpeciesListItems(items: Species[]): Species[] {
  if (items.length === 0) {
    return [];
  }
  const out: Species[] = [];
  let run: Species[] = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const next = items[i];
    if (canExtendRun(run, next)) {
      run.push(next);
    } else {
      out.push(finishRun(run));
      run = [next];
    }
  }
  out.push(finishRun(run));
  return out;
}
