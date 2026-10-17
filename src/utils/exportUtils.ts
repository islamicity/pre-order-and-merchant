import { Order, Product, StockMovementLog } from '../types';
import { formatRupiah, formatDateIndo, formatShortDate } from './formatters';

// Export Orders to CSV (Excel & Google Sheets compatible with UTF-8 BOM)
export function exportOrdersToCsv(orders: Order[], filename = 'Laporan-Penjualan-PreOrder.csv') {
  const headers = [
    'No Pesanan',
    'Tanggal Pesan',
    'Nama Pelanggan',
    'Nomor WhatsApp',
    'Metode Pengiriman',
    'Daftar Produk',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Kode Unik (Rp)',
    'Total Pembayaran (Rp)',
    'Uang Muka/DP (Rp)',
    'Sisa Tagihan (Rp)',
    'Metode Pembayaran',
    'Status Pembayaran',
    'Status Pesanan',
    'Estimasi Selesai',
    'Staf Kasir'
  ];

  const rows = orders.map(o => {
    const itemSummary = o.items
      .map(i => `${i.productName}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`)
      .join('; ');

    return [
      `"${o.id}"`,
      `"${formatShortDate(o.createdAt)}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"'${o.customerPhone}"`, // prepend single quote so Excel treats as string
      `"${o.deliveryMethod === 'delivery' ? 'Kirim Ekspedisi/Kurir' : 'Ambil di Toko'}"`,
      `"${itemSummary.replace(/"/g, '""')}"`,
      o.subtotal,
      o.discountAmount,
      o.uniqueCode,
      o.totalAmount,
      o.dpAmount,
      o.remainingAmount,
      `"${o.paymentMethod.toUpperCase()}"`,
      `"${o.paymentStatus}"`,
      `"${o.orderStatus}"`,
      `"${formatShortDate(o.estimatedReadyDate)}"`,
      `"${o.cashierStaffName}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

// Export Inventory & Low Stock to CSV
export function exportInventoryToCsv(products: Product[], filename = 'Laporan-Stok-Inventaris.csv') {
  const headers = [
    'SKU',
    'Nama Produk',
    'Kategori',
    'Tipe',
    'Harga Jual (Rp)',
    'HPP (Rp)',
    'Margin Keuntungan (Rp)',
    'Stok / Kuota',
    'Ambang Minimum',
    'Status Stok',
    'Total Dipesan',
    'Total Terpenuhi',
    'Nama Batch PO',
    'Estimasi Ready'
  ];

  const rows = products.map(p => {
    const margin = p.price - p.costPrice;
    const isLow = p.stock <= p.minStockThreshold;
    return [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.type === 'preorder' ? 'Pre-Order' : 'Ready Stock'}"`,
      p.price,
      p.costPrice,
      margin,
      p.stock,
      p.minStockThreshold,
      `"${isLow ? 'MENIPIS' : 'AMAN'}"`,
      p.totalOrdered,
      p.totalFulfilled,
      `"${p.batchName || '-'}"`,
      `"${p.estimatedFulfillmentDate ? formatShortDate(p.estimatedFulfillmentDate) : '-'}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

// Export Stock Movement Log
export function exportStockLogsToCsv(logs: StockMovementLog[], filename = 'Riwayat-Mutasi-Stok.csv') {
  const headers = [
    'Waktu',
    'Nama Produk',
    'Tipe Perubahan',
    'Perubahan Jumlah',
    'Stok Sebelum',
    'Stok Sesudah',
    'Catatan',
    'Staf/Sistem'
  ];

  const rows = logs.map(l => [
    `"${formatDateIndo(l.timestamp, true)}"`,
    `"${l.productName.replace(/"/g, '""')}"`,
    `"${l.type}"`,
    l.changeAmount,
    l.previousStock,
    l.newStock,
    `"${l.note.replace(/"/g, '""')}"`,
    `"${l.performedBy}"`
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

// Copy Tab-Separated Values for 1-Click Paste into Google Sheets
export function copyForGoogleSheets(orders: Order[]): Promise<boolean> {
  const headers = [
    'No Pesanan', 'Tanggal', 'Pelanggan', 'WhatsApp', 'Produk',
    'Total (Rp)', 'DP (Rp)', 'Sisa (Rp)', 'Metode Bayar', 'Status Bayar', 'Status PO'
  ].join('\t');

  const rows = orders.map(o => {
    const itemSummary = o.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
    return [
      o.id,
      formatShortDate(o.createdAt),
      o.customerName,
      o.customerPhone,
      itemSummary,
      o.totalAmount,
      o.dpAmount,
      o.remainingAmount,
      o.paymentMethod.toUpperCase(),
      o.paymentStatus,
      o.orderStatus
    ].join('\t');
  }).join('\n');

  const fullTsv = `${headers}\n${rows}`;
  return navigator.clipboard.writeText(fullTsv).then(() => true).catch(() => false);
}

// Direct Blob Downloader helper
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Trigger Print for PDF Export with Clean Print-Friendly Dialog
export function printDocument(elementId?: string) {
  if (elementId) {
    const target = document.getElementById(elementId);
    if (target) {
      target.classList.add('printable-card');
    }
  }
  window.print();
}
