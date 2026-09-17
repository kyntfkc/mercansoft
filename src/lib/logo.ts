const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-678d.up.railway.app';

export const DEFAULT_LOGO = '/logo-indigo.png';

/** Header marka logo boyutları */
export const BRAND_LOGO_SX = {
  height: { xs: '2.25rem', md: '2.5rem' },
  width: 'auto',
  maxWidth: '100%',
  objectFit: 'contain' as const,
  display: 'block',
};

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

/**
 * Termal fiş için net siyah logo üretir.
 * Kenar boşluklarını kırpar, ardından hedef yüksekliğe ölçekler.
 */
export function prepareThermalPrintLogo(
  src: string,
  targetHeightPx = 160
): Promise<string> {
  if (typeof window === 'undefined') return Promise.resolve(src);

  let absolute = src;
  if (src.startsWith('/')) {
    absolute = `${window.location.origin}${src}`;
  } else if (!src.startsWith('http') && !src.startsWith('data:')) {
    absolute = resolveLogoUrl(src);
    if (absolute.startsWith('/')) {
      absolute = `${window.location.origin}${absolute}`;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (!absolute.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        if (!srcW || !srcH) {
          resolve(absolute);
          return;
        }

        // Önce makul boyutta işle (çok büyük görselleri sınırla)
        const maxSide = 1200;
        const prepScale = Math.min(1, maxSide / Math.max(srcW, srcH));
        const prepW = Math.max(1, Math.round(srcW * prepScale));
        const prepH = Math.max(1, Math.round(srcH * prepScale));

        const canvas = document.createElement('canvas');
        canvas.width = prepW;
        canvas.height = prepH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(absolute);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.clearRect(0, 0, prepW, prepH);
        ctx.drawImage(img, 0, 0, prepW, prepH);

        const imageData = ctx.getImageData(0, 0, prepW, prepH);
        const { data } = imageData;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (a < 40 || luminance > 210) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        let minX = prepW;
        let minY = prepH;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < prepH; y++) {
          for (let x = 0; x < prepW; x++) {
            if (data[(y * prepW + x) * 4 + 3] > 0) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX < minX || maxY < minY) {
          resolve(absolute);
          return;
        }

        const pad = 2;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(prepW - cropX, maxX - minX + 1 + pad * 2);
        const cropH = Math.min(prepH - cropY, maxY - minY + 1 + pad * 2);

        const scale = targetHeightPx / cropH;
        const outW = Math.max(1, Math.round(cropW * scale));
        const outH = Math.max(1, Math.round(cropH * scale));

        const out = document.createElement('canvas');
        out.width = outW;
        out.height = outH;
        const octx = out.getContext('2d');
        if (!octx) {
          resolve(absolute);
          return;
        }

        octx.imageSmoothingEnabled = false;
        octx.clearRect(0, 0, outW, outH);
        octx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
        resolve(out.toDataURL('image/png'));
      } catch {
        resolve(absolute);
      }
    };
    img.onerror = () => resolve(absolute);
    img.src = absolute;
  });
}
