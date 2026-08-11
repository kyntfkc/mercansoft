import { normalizeSearchText } from './search';

export type MetalType = 'altın' | 'gümüş';
export type MetalTypeFilter = MetalType | 'all';

export const METAL_TYPE_OPTIONS: Array<{ value: MetalType; label: string }> = [
  { value: 'altın', label: 'Altın' },
  { value: 'gümüş', label: 'Gümüş' },
];

export function inferMetalTypeFromName(name: string): MetalType | undefined {
  const normalized = normalizeSearchText(name);

  if (normalized.includes('14 ayar altin')) {
    return 'altın';
  }

  if (normalized.includes('gumus')) {
    return 'gümüş';
  }

  return undefined;
}

export function resolveMetalType(
  name: string,
  metalType?: MetalType
): MetalType | undefined {
  return metalType ?? inferMetalTypeFromName(name);
}

export function matchesMetalTypeFilter(
  metalType: MetalType | undefined,
  filter: MetalTypeFilter
): boolean {
  if (filter === 'all') {
    return true;
  }
  return metalType === filter;
}

export function getMetalTypeLabel(metalType?: MetalType): string {
  if (!metalType) {
    return '-';
  }
  return metalType === 'altın' ? 'Altın' : 'Gümüş';
}
