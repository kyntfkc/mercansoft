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

export interface ReceiptStoneDetail {
  stoneName: string;
  quantity: number;
  totalWeight: number;
}

export interface ReceiptPrintItem {
  modelName: string;
  productionCount: number;
  totalWeight: number;
  stoneDetails?: ReceiptStoneDetail[];
}

export interface ReceiptPrintData {
  modelName?: string;
  productionCount?: number;
  totalWeight?: number;
  stoneDetails?: ReceiptStoneDetail[];
  items?: ReceiptPrintItem[];
  printedAt?: Date;
}

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
  margins: { top: 5, right: 5, bottom: 5, left: 5 },
  width: 80,
  minHeight: 120,
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

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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

export function buildReceiptHtml(
  settings: ReceiptSettings,
  data: ReceiptPrintData,
  logoUrl?: string | null
): string {
  const printedAt = data.printedAt ?? new Date();
  const items: ReceiptPrintItem[] =
    data.items && data.items.length > 0
      ? data.items
      : [
          {
            modelName: settings.modelName?.trim() || data.modelName || '',
            productionCount: Number(data.productionCount || 0),
            totalWeight: Number(data.totalWeight || 0),
            stoneDetails: data.stoneDetails || [],
          },
        ];
  const totalWeight = items.reduce((sum, item) => sum + Number(item.totalWeight || 0), 0);
  const title = escapeHtml(settings.title || '');
  const footerText = escapeHtml(settings.footerText || '');
  const resolvedLogo = logoUrl ? resolveLogoUrl(logoUrl) : null;
  const logoHeight = Math.max(24, Math.round((settings.logoSize / 100) * 48));
  const datePart = settings.showDate ? formatDate(printedAt) : '';
  const timePart = settings.showTime ? formatTime(printedAt) : '';
  const metaText = [datePart, timePart].filter(Boolean).join(' ');
  const multi = items.length > 1;

  const renderStoneDetails = (stoneDetails?: ReceiptStoneDetail[]) => {
    if (!stoneDetails || stoneDetails.length === 0) return '';
    const rows = stoneDetails
      .map((stone) => {
        const name = escapeHtml(stone.stoneName || 'Bilinmeyen Taş');
        const qty = Number(stone.quantity || 0);
        const weight = Number(stone.totalWeight || 0).toFixed(3);
        return `<div class="stone-row">
          <div class="stone-name">${name} x ${qty} Adet</div>
          <div class="stone-weight">${weight} gr</div>
        </div>`;
      })
      .join('');
    return `<div class="stones">
      <div class="stones-title">Taş Detayları</div>
      ${rows}
    </div>`;
  };

  const itemsHtml = items
    .map((item) => {
      const modelName = escapeHtml(item.modelName || '');
      const qty = Number(item.productionCount || 0);
      const weight = Number(item.totalWeight || 0).toFixed(2);
      const stonesHtml = renderStoneDetails(item.stoneDetails);
      if (multi) {
        return `<div class="item">
          ${settings.showModel ? `<div class="item-name">${modelName}</div>` : ''}
          <div class="item-meta">
            ${settings.showQuantity ? `<span>${qty} adet</span>` : ''}
            <span>${weight} gr</span>
          </div>
          ${stonesHtml}
        </div>`;
      }
      return `
      ${settings.showModel ? `<div class="model">${modelName}</div>` : ''}
      <div class="details">
        ${settings.showQuantity ? `<div class="detail-item"><div class="detail-value">${qty}</div><div class="detail-label">Adet</div></div>` : ''}
        <div class="detail-item"><div class="detail-value">${weight}</div><div class="detail-label">Taş Gramı</div></div>
      </div>
      ${stonesHtml}`;
    })
    .join('');

  const totalHtml = multi
    ? `<div class="total">
        <div class="total-label">Toplam Taş Gramı</div>
        <div class="total-value">${totalWeight.toFixed(2)} gr</div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Fiş Yazdır</title>
    <style>
      @page {
        size: ${settings.width}mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        width: ${settings.width}mm;
        min-height: ${settings.minHeight}mm;
        font-family: ${settings.fontFamily};
        color: ${settings.textColor};
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt {
        padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
        min-height: ${Math.max(40, settings.minHeight - settings.margins.top - settings.margins.bottom)}mm;
        display: flex;
        flex-direction: column;
        text-align: ${settings.titleCenter ? 'center' : 'left'};
        box-sizing: border-box;
      }
      .logo {
        margin-bottom: 4mm;
      }
      .logo img {
        max-width: 100%;
        height: ${logoHeight}px;
        object-fit: contain;
      }
      .header {
        margin-bottom: 4mm;
        border-bottom: 1px dashed ${settings.borderColor};
        padding-bottom: 2mm;
        font-size: ${settings.titleSize}px;
        font-weight: ${settings.titleBold ? 'bold' : 'normal'};
        color: ${settings.titleColor};
      }
      .meta {
        font-size: ${Math.max(8, settings.fontSize - 1)}px;
        color: #666;
        margin-bottom: 3mm;
      }
      .model {
        font-size: ${settings.fontSize + 2}px;
        padding: 3mm 0;
        background-color: ${settings.headerBgColor};
        margin: 3mm 0;
        border-radius: 3px;
      }
      .items {
        text-align: left;
        margin: 2mm 0;
      }
      .item {
        padding: 2.5mm 0;
        border-bottom: 1px dashed ${settings.borderColor};
      }
      .item:last-child {
        border-bottom: none;
      }
      .item-name {
        font-size: ${settings.fontSize + 1}px;
        font-weight: ${settings.tableHeaderBold ? 'bold' : 'normal'};
        margin-bottom: 1mm;
        word-break: break-word;
      }
      .item-meta {
        display: flex;
        justify-content: space-between;
        gap: ${settings.columnSpacing}px;
        font-size: ${settings.fontSize}px;
        color: #444;
      }
      .stones {
        margin-top: 2mm;
        padding-top: 1.5mm;
        border-top: 1px dotted ${settings.borderColor};
        text-align: left;
      }
      .stones-title {
        font-size: ${Math.max(8, settings.fontSize - 1)}px;
        font-weight: ${settings.tableHeaderBold ? 'bold' : 'normal'};
        color: #666;
        text-transform: uppercase;
        margin-bottom: 1.5mm;
      }
      .stone-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: ${settings.columnSpacing}px;
        padding: 1.2mm 0;
      }
      .stone-name {
        flex: 1;
        font-size: ${settings.fontSize}px;
        font-weight: 500;
        word-break: break-word;
      }
      .stone-weight {
        flex-shrink: 0;
        font-size: ${Math.max(8, settings.fontSize - 1)}px;
        color: #555;
      }
      .details {
        display: flex;
        justify-content: space-between;
        gap: ${settings.columnSpacing}px;
        padding: 3mm 0;
      }
      .detail-item {
        flex: 1;
        text-align: center;
      }
      .detail-value {
        font-size: ${settings.fontSize + 4}px;
        font-weight: bold;
        color: ${settings.titleColor};
      }
      .detail-label {
        font-size: ${Math.max(8, settings.fontSize - 2)}px;
        color: #666;
        text-transform: uppercase;
      }
      .total {
        margin-top: 3mm;
        padding: 3mm;
        background-color: ${settings.headerBgColor};
        border-radius: 3px;
        text-align: center;
      }
      .total-label {
        font-size: ${Math.max(8, settings.fontSize - 1)}px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 1mm;
      }
      .total-value {
        font-size: ${settings.fontSize + 4}px;
        font-weight: bold;
        color: ${settings.titleColor};
      }
      .footer {
        margin-top: auto;
        font-size: ${settings.footerFontSize}px;
        padding-top: 3mm;
        border-top: 1px dashed ${settings.borderColor};
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      ${settings.showLogo && resolvedLogo ? `<div class="logo"><img src="${resolvedLogo}" alt="Logo" /></div>` : ''}
      ${settings.showTitle ? `<div class="header">${title}</div>` : ''}
      ${metaText ? `<div class="meta">${metaText}</div>` : ''}
      ${multi ? `<div class="items">${itemsHtml}</div>` : itemsHtml}
      ${totalHtml}
      ${settings.showFooter ? `<div class="footer">${footerText}</div>` : ''}
    </div>
  </body>
</html>`;
}

export function openPrintWindow(html: string): void {
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) {
    throw new Error('Yazdırma penceresi açılamadı. Tarayıcı pop-up engelini kontrol edin.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error('Yazdırma tetiklenemedi:', error);
    }
  };

  printWindow.onload = triggerPrint;
  setTimeout(triggerPrint, 400);
}
