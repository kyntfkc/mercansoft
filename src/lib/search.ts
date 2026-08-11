const TR_LOCALE = 'tr-TR';

// Türkçe I/İ/ı/i ve benzeri karakterleri aramada eşleştirir.
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase(TR_LOCALE)
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function getSearchTerms(needle: string): string[] {
  return normalizeSearchText(needle).split(/\s+/).filter(Boolean);
}

export function matchesSearch(
  haystack: string | null | undefined,
  needle: string
): boolean {
  const terms = getSearchTerms(needle);
  if (terms.length === 0) {
    return true;
  }
  if (!haystack) {
    return false;
  }

  const normalizedHaystack = normalizeSearchText(haystack);
  return terms.every((term) => normalizedHaystack.includes(term));
}

export function matchesAnySearch(
  needle: string,
  ...values: Array<string | null | undefined>
): boolean {
  const terms = getSearchTerms(needle);
  if (terms.length === 0) {
    return true;
  }

  const haystack = values
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeSearchText(value))
    .join(' ');

  if (!haystack) {
    return false;
  }

  return terms.every((term) => haystack.includes(term));
}
