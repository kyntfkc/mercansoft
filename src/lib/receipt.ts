import { resolveLogoUrl } from './logo';

export interface ReceiptMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ReceiptSettings {
  showTitle: boolean;
  title: string;
  titleSize: number;
  titleBold: boolean;
  titleCenter: boolean;
  titleColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textColor: string;
  showLogo: boolean;
  logoSize: number;
  showDate: boolean;
  showTime: boolean;
  showModel: boolean;
  showQuantity: boolean;
  modelName: string;
  dateFormat: string;
  timeFormat: string;
  tableBorder: boolean;
  tableHeaderBold: boolean;
  columnSpacing: number;
  headerBgColor: string;
  borderColor: string;
  margins: ReceiptMargins;
  width: number;
  minHeight: number;
  showFooter: boolean;
  footerText: string;
  footerFontSize: number;
}

export interface ReceiptPrintData {
  totalWeight?: number;
  metalLabel?: string;
  printedAt?: Date;
}

export const METAL_PRINT_LABELS = {
  altın: '14 Ayar Yeşil',
  gümüş: '925 ayar Gümüş',
} as const;

export type PrintMetalType = keyof typeof METAL_PRINT_LABELS;

export const defaultReceiptSettings = (): ReceiptSettings => ({
  showTitle: true,
  title: 'MercanSoft',
  titleSize: 16,
  titleBold: true,
  titleCenter: true,
  titleColor: '#225C73',
  fontFamily: 'Arial',
  fontSize: 12,
  lineHeight: 1.5,
  textColor: '#000000',
  showLogo: true,
  logoSize: 100,
  showDate: true,
  showTime: true,
  showModel: true,
  showQuantity: true,
  modelName: '',
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24',
  tableBorder: true,
  tableHeaderBold: true,
  columnSpacing: 8,
  headerBgColor: '#f5f5f5',
  borderColor: '#e0e0e0',
  margins: { top: 2, right: 2, bottom: 2, left: 2 },
  width: 72,
  minHeight: 60,
  showFooter: true,
  footerText: 'Teşekkür ederiz.',
  footerFontSize: 10,
});

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function mergeReceiptSettings(partial?: Partial<ReceiptSettings> | null): ReceiptSettings {
  const defaults = defaultReceiptSettings();
  if (!partial) return defaults;
  return {
    ...defaults,
    ...partial,
    margins: { ...defaults.margins, ...(partial.margins || {}) },
  };
}

/**
 * Termal fiş (80mm rulo / ~72mm baskı alanı).
 * Tek sütun, sabit siyah mürekkep, sıkı dikey boşluk — dekoratif ayarlar yok sayılır.
 */
export function buildReceiptHtml(
  _settings: ReceiptSettings,
  data: ReceiptPrintData,
  logoUrl?: string | null
): string {
  const printedAt = data.printedAt ?? new Date();
  const totalWeight = Number(data.totalWeight || 0).toFixed(2);
  const metalLabel = data.metalLabel ? escapeHtml(data.metalLabel) : '';
  let resolvedLogo = logoUrl ? resolveLogoUrl(logoUrl) : null;
  if (resolvedLogo && resolvedLogo.startsWith('/') && typeof window !== 'undefined') {
    resolvedLogo = `${window.location.origin}${resolvedLogo}`;
  }
  const dateText = formatDate(printedAt);
  const w = 72;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fiş</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${w}mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.2;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: ${w}mm auto;
      margin: 0;
    }
    @media print {
      html, body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      @page { margin: 0 !important; }
    }
    .r {
      width: 100%;
      padding: 1mm 2mm 2mm;
      text-align: center;
    }
    .logo {
      margin: 0 0 1mm;
      line-height: 0;
    }
    .logo img {
      display: block;
      margin: 0 auto;
      width: auto;
      max-width: 58mm;
      max-height: 16mm;
      height: auto;
      image-rendering: crisp-edges;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .date {
      margin: 0 0 1mm;
      font-size: 14px;
      font-weight: 800;
    }
    .sep {
      border: 0;
      border-top: 1px solid #000;
      margin: 0 0 1.5mm;
      height: 0;
    }
    .row {
      width: 100%;
      border: 2px solid #000;
      padding: 1.5mm 1mm;
      margin: 0 0 1.5mm;
      text-align: center;
    }
    .row:last-child { margin-bottom: 0; }
    .metal {
      font-size: 13px;
      font-weight: 800;
    }
    .lbl {
      display: block;
      font-size: 10px;
      font-weight: 700;
      margin: 0 0 0.5mm;
    }
    .val {
      display: block;
      font-size: 17px;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="r">
    ${resolvedLogo ? `<div class="logo"><img src="${resolvedLogo}" alt="" /></div>` : ''}
    <div class="date">${dateText}</div>
    <hr class="sep" />
    ${metalLabel ? `<div class="row metal">${metalLabel}</div>` : ''}
    <div class="row">
      <span class="lbl">Toplam Taş Gramı</span>
      <span class="val">${totalWeight} gr</span>
    </div>
  </div>
</body>
</html>`;
}

export function openPrintWindow(html: string): void {
  // Firefox yazdırma paneli için geniş pencere; boyut vermezsek küçük popup açılır
  const printWindow = window.open(
    '',
    '_blank',
    'popup=yes,width=960,height=720,left=80,top=40,scrollbars=yes,resizable=yes'
  );
  if (!printWindow) {
    throw new Error('Yazdırma penceresi açılamadı. Tarayıcı pop-up engelini kontrol edin.');
  }

  // Yazdırma bitince / iptalde pencereyi kapat (Firefox dahil)
  const htmlWithClose = html.replace(
    '</body>',
    `<script>
(function () {
  var closed = false;
  function closeWin() {
    if (closed) return;
    closed = true;
    setTimeout(function () {
      try { window.close(); } catch (e) {}
    }, 120);
  }
  window.addEventListener('afterprint', closeWin);
  if (window.matchMedia) {
    try {
      var mql = window.matchMedia('print');
      var onChange = function (e) {
        if (!e.matches) closeWin();
      };
      if (mql.addEventListener) mql.addEventListener('change', onChange);
      else if (mql.addListener) mql.addListener(onChange);
    } catch (e) {}
  }
})();
</script></body>`
  );

  printWindow.document.open();
  printWindow.document.write(htmlWithClose);
  printWindow.document.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error('Yazdırma tetiklenemedi:', error);
      try {
        printWindow.close();
      } catch (e) {}
    }
  };

  const images = Array.from(printWindow.document.images || []);
  if (images.length === 0) {
    setTimeout(triggerPrint, 200);
    return;
  }

  let remaining = images.length;
  const onImageDone = () => {
    remaining -= 1;
    if (remaining <= 0) setTimeout(triggerPrint, 250);
  };

  images.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      onImageDone();
      return;
    }
    img.addEventListener('load', onImageDone, { once: true });
    img.addEventListener('error', onImageDone, { once: true });
  });

  setTimeout(triggerPrint, 3000);
}
