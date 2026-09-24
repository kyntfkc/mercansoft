const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { print, getPrinters } = require('pdf-to-printer');

const PORT = Number(process.env.PRINT_AGENT_PORT || 39100);
const DEFAULT_PRINTER = process.env.RECEIPT_PRINTER_NAME || 'FisYaz Ethernet';

const EDGE_PATHS = [
  process.env.EDGE_PATH,
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

function findBrowser() {
  for (const candidate of EDGE_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function resolvePrinterName(preferredName) {
  const target = (preferredName || DEFAULT_PRINTER).trim();
  const printers = await getPrinters();
  const names = printers.map((p) => (typeof p === 'string' ? p : p.name)).filter(Boolean);

  const exact = names.find((name) => name === target);
  if (exact) return exact;

  const ci = names.find((name) => name.toLowerCase() === target.toLowerCase());
  if (ci) return ci;

  const partial = names.find((name) => name.toLowerCase().includes(target.toLowerCase()));
  if (partial) return partial;

  throw new Error(
    `"${target}" yazıcısı bulunamadı. Mevcut yazıcılar: ${names.join(', ') || 'yok'}`
  );
}

async function htmlToPdf(html, widthMm = 80) {
  const executablePath = findBrowser();
  if (!executablePath) {
    throw new Error('Edge/Chrome bulunamadı. Microsoft Edge kurulu olmalı.');
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
    const pdfPath = path.join(
      os.tmpdir(),
      `mercansoft-fis-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
    );
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      width: `${widthMm}mm`,
      height: '300mm',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return pdfPath;
  } finally {
    await browser.close();
  }
}

const app = express();
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '5mb' }));

app.get('/health', async (_req, res) => {
  try {
    const printers = await getPrinters();
    const names = printers.map((p) => (typeof p === 'string' ? p : p.name)).filter(Boolean);
    res.json({
      ok: true,
      printer: DEFAULT_PRINTER,
      printers: names,
      browser: findBrowser(),
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.post('/print', async (req, res) => {
  let pdfPath = null;
  try {
    const html = req.body?.html;
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ success: false, message: 'html gerekli' });
    }

    const printerName = await resolvePrinterName(req.body?.printer || DEFAULT_PRINTER);
    const widthMm = Number(req.body?.width || 80);
    pdfPath = await htmlToPdf(html, widthMm);

    await print(pdfPath, {
      printer: printerName,
      silent: true,
      scale: 'noscale',
    });

    res.json({
      success: true,
      message: `Fiş "${printerName}" yazıcısına gönderildi`,
    });
  } catch (error) {
    console.error('Yazdırma hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Yazdırma başarısız',
    });
  } finally {
    if (pdfPath) {
      fs.promises.unlink(pdfPath).catch(() => {});
    }
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`MercanSoft yazdırma servisi hazır: http://127.0.0.1:${PORT}`);
  console.log(`Hedef yazıcı: ${DEFAULT_PRINTER}`);
});
