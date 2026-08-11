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
