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

export function trackExploreFlatRow(index: number, row: ExploreFlatRow): string {
  if (row.kind === 'divider') {
    return `d:${row.group.name}`;
  }
  const item = row.item;
  return `i:${index}:${item.id}:${item.nameLocal}:${item.mergedLocalNamesDisplay ?? ''}`;
}
