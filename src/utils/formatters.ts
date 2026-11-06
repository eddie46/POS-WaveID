import { CurrencyCode, PurchaseOrder } from '../types/po';

export function formatCurrency(amount: number, currency: CurrencyCode = 'IDR'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function calculatePOTotals(po: PurchaseOrder) {
  const subtotal = po.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const discountRate = Math.max(0, Math.min(100, Number(po.discountPercent) || 0));
  const discountAmount = Math.round((subtotal * discountRate) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = Math.max(0, Number(po.taxPercent) || 0);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const shipping = Math.max(0, Number(po.shippingCost) || 0);
  const grandTotal = taxableAmount + taxAmount + shipping;

  const totalQuantity = po.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    shipping,
    grandTotal,
    totalQuantity,
  };
}

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function terbilangCore(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num < 12) {
    return SATUAN[num];
  }
  if (num < 20) {
    return `${terbilangCore(num - 10)} Belas`.trim();
  }
  if (num < 100) {
    return `${terbilangCore(Math.floor(num / 10))} Puluh ${terbilangCore(num % 10)}`.trim();
  }
  if (num < 200) {
    return `Seratus ${terbilangCore(num - 100)}`.trim();
  }
  if (num < 1000) {
    return `${terbilangCore(Math.floor(num / 100))} Ratus ${terbilangCore(num % 100)}`.trim();
  }
  if (num < 2000) {
    return `Seribu ${terbilangCore(num - 1000)}`.trim();
  }
  if (num < 1000000) {
    return `${terbilangCore(Math.floor(num / 1000))} Ribu ${terbilangCore(num % 1000)}`.trim();
  }
  if (num < 1000000000) {
    return `${terbilangCore(Math.floor(num / 1000000))} Juta ${terbilangCore(num % 1000000)}`.trim();
  }
  if (num < 1000000000000) {
    return `${terbilangCore(Math.floor(num / 1000000000))} Miliar ${terbilangCore(num % 1000000000)}`.trim();
  }
  return `${terbilangCore(Math.floor(num / 1000000000000))} Triliun ${terbilangCore(num % 1000000000000)}`.trim();
}

export function formatTerbilang(amount: number, currency: CurrencyCode = 'IDR'): string {
  const rounded = Math.round(amount);
  if (!rounded || rounded <= 0) {
    return currency === 'USD' ? 'Nol Dolar Amerika' : 'Nol Rupiah';
  }
  const words = terbilangCore(rounded).replace(/\s+/g, ' ').trim();
  const suffix = currency === 'USD' ? 'Dolar Amerika Serikat' : 'Rupiah';
  return `${words} ${suffix}`;
}

export function formatDateID(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function exportPOToCSV(po: PurchaseOrder): void {
  const totals = calculatePOTotals(po);
  const headers = ['No', 'Kode SKU', 'Nama Barang', 'Spesifikasi', 'Qty', 'Satuan', 'Harga Satuan', 'Jumlah'];
  const rows = po.items.map((item, idx) => [
    String(idx + 1),
    `"${(item.sku || '').replace(/"/g, '""')}"`,
    `"${(item.name || '').replace(/"/g, '""')}"`,
    `"${(item.specification || '').replace(/"/g, '""')}"`,
    String(item.quantity),
    `"${item.unit}"`,
    String(item.unitPrice),
    String((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
  ]);

  rows.push([]);
  rows.push(['', '', '', '', '', '', 'Subtotal', String(totals.subtotal)]);
  rows.push(['', '', '', '', '', '', `Diskon (${po.discountPercent}%)`, String(-totals.discountAmount)]);
  rows.push(['', '', '', '', '', '', `PPN (${po.taxPercent}%)`, String(totals.taxAmount)]);
  rows.push(['', '', '', '', '', '', 'Biaya Kirim', String(totals.shipping)]);
  rows.push(['', '', '', '', '', '', 'Grand Total', String(totals.grandTotal)]);

  const csvContent = [
    `Nomor PO,${po.poNumber}`,
    `Tanggal Terbit,${po.issueDate}`,
    `Vendor,"${po.vendorName.replace(/"/g, '""')}"`,
    `Status,${po.status}`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${po.poNumber || 'Purchase-Order'}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
