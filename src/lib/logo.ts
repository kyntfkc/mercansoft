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

/**
 * Beyaza yakın pikselleri şeffaf yapar (logo dosyasındaki beyaz arka planı kaldırır).
 * Cross-origin engelinde orijinal URL döner.
 */
export function removeLogoWhiteBackground(src: string, threshold = 245): Promise<string> {
  if (typeof window === 'undefined') return Promise.resolve(src);
  if (!src || src.endsWith('.svg') || src.includes('company-logo.svg')) {
    return Promise.resolve(src);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx || canvas.width === 0 || canvas.height === 0) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
