import { Species, SpeciesGroup } from 'app/models/species.model';

export type ExploreFlatRow =
  | { kind: 'divider'; group: SpeciesGroup }
  | { kind: 'item'; item: Species; isLastItem: boolean };

/** Flatten grouped explore rows for CDK virtual scroll (divider + item rows). */
export function buildExploreFlatRows(groups: SpeciesGroup[]): ExploreFlatRow[] {
  const rows: ExploreFlatRow[] = [];
  for (const group of groups) {
    rows.push({ kind: 'divider', group });
    const items = group.items;
    for (let i = 0; i < items.length; i++) {
      rows.push({
        kind: 'item',
        item: items[i],
        isLastItem: i === items.length - 1,
      });
    }
  }
  return rows;
}

export function collectExploreDividerIndices(rows: ExploreFlatRow[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].kind === 'divider') {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * Section for the sticky header overlay: last divider at or above the viewport top edge.
 * Uses getBoundingClientRect tops (reliable with CDK content transforms).
 */
export function findActiveDividerByViewportTop(
  rows: ExploreFlatRow[],
  dividerIndices: number[],
  viewportTop: number,
  rowViewportTop: (index: number) => number | null
): SpeciesGroup | null {
  let active: SpeciesGroup | null = null;

  for (const index of dividerIndices) {
    const top = rowViewportTop(index);
    if (top === null) {
      continue;
    }
    if (top <= viewportTop + 2) {
      const row = rows[index];
      if (row.kind === 'divider') {
        active = row.group;
      }
    } else {
      break;
    }
  }

  return active;
}

export function trackExploreFlatRow(index: number, row: ExploreFlatRow): string {
  if (row.kind === 'divider') {
    return `d:${row.group.name}`;
  }
  const item = row.item;
  return `i:${index}:${item.id}:${item.nameLocal}:${item.mergedLocalNamesDisplay ?? ''}`;
}
