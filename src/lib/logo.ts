const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-678d.up.railway.app';

export const DEFAULT_LOGO = '/company-logo.svg';

export function resolveLogoUrl(logo?: string | null): string {
  if (!logo || logo.trim() === '') {
    return DEFAULT_LOGO;
  }

  if (logo.startsWith('data:image/')) {
    return logo;
  }

  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }

  if (logo.startsWith('/uploads/')) {
    return `${API_URL}${logo}`;
  }

  return logo;
}

/** localStorage'daki firma logosunu senkron oku (SSR'da null). */
export function getCachedCompanyLogo(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('companySettings');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed?.logo && String(parsed.logo).trim() !== '') {
      return resolveLogoUrl(parsed.logo);
    }
  } catch {
    // ignore
  }
  return null;
}

export function cacheCompanyLogo(logo?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('companySettings');
    const parsed = saved ? JSON.parse(saved) : {};
    parsed.logo = logo || null;
    localStorage.setItem('companySettings', JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
