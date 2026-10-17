import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Copy,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  Table
} from 'lucide-react';
import { Order, Product, StockMovementLog, CustomerLoyalty } from '../types';
import { formatRupiah, formatDateIndo, formatShortDate } from '../utils/formatters';
import {
  exportOrdersToCsv,
  exportInventoryToCsv,
  exportStockLogsToCsv,
  copyForGoogleSheets,
  printDocument
} from '../utils/exportUtils';

interface ReportsExportViewProps {
  orders: Order[];
  products: Product[];
  stockLogs: StockMovementLog[];
  loyaltyCustomers: CustomerLoyalty[];
}

export const ReportsExportView: React.FC<ReportsExportViewProps> = ({
  orders,
  products,
  stockLogs,
  loyaltyCustomers,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [copyStatus, setCopyStatus] = useState(false);

  // Filter orders by month
  const monthOrders = orders.filter(o => o.createdAt.startsWith(selectedMonth));
  const validOrders = monthOrders.filter(o => o.orderStatus !== 'cancelled');

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCost = validOrders.reduce((sum, o) => {
    return sum + o.items.reduce((s, i) => s + ((i.costPrice || 0) * i.quantity), 0);
  }, 0);
  const grossProfit = totalRevenue - totalCost;

  // Payment Breakdown
  const paymentBreakdown = {
    qris: validOrders.filter(o => o.paymentMethod === 'qris').reduce((s, o) => s + o.totalAmount, 0),
    bank: validOrders.filter(o => o.paymentMethod === 'bank_transfer').reduce((s, o) => s + o.totalAmount, 0),
    ewallet: validOrders.filter(o => o.paymentMethod === 'ewallet').reduce((s, o) => s + o.totalAmount, 0),
    cash: validOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.totalAmount, 0),
  };

  const handleCopySheets = async () => {
    const success = await copyForGoogleSheets(monthOrders.length > 0 ? monthOrders : orders);
    if (success) {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            Pusat Laporan & Ekspor Data (PDF, Excel, Google Sheets)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Unduh rekapitulasi penjualan, analisis HPP/laba kotor, dan mutasi inventaris untuk pembukuan akuntansi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <button
            onClick={() => printDocument('printable-monthly-report')}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* CSV Excel Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ekspor Excel / CSV Lengkap</h3>
            <p className="text-xs text-slate-500 mt-1">
              File .csv berstandar UTF-8 dengan pemisah kolom rapi untuk dibuka di Microsoft Excel atau LibreOffice.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <button
              onClick={() => exportOrdersToCsv(orders, `Laporan-Pesanan-${selectedMonth}.csv`)}
              className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 transition text-left flex justify-between items-center"
            >
              <span>Download Transaksi PO</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={() => exportInventoryToCsv(products)}
              className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 transition text-left flex justify-between items-center"
            >
              <span>Download Stok & Kuota</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

        {/* Google Sheets 1-Click Sync */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sinkronisasi Google Sheets</h3>
            <p className="text-xs text-slate-500 mt-1">
              Salin seluruh baris tabel transaksi dalam format TSV dan langsung paste (Ctrl+V) di lembar Google Sheets baru.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleCopySheets}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span>{copyStatus ? '✓ Data Berhasil Tersalin!' : 'Salin Data untuk Google Sheets'}</span>
            </button>
          </div>
        </div>

        {/* PDF Executive Print */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Format PDF Laporan Bulanan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dokumen siap cetak resolusi tinggi berformat A4 lengkap dengan kop surat bisnis, ringkasan kas, dan tanda tangan audit.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => printDocument('printable-monthly-report')}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Pratinjau & Cetak PDF Resmi</span>
            </button>
          </div>
        </div>

      </div>

      {/* Printable Monthly Report Paper UI */}
      <div
        id="printable-monthly-report"
        className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm printable-card space-y-6"
      >
        {/* Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-900 dark:border-white gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              TAMAN KULINER ISLAMICITY
            </h2>
            <p className="text-xs text-slate-500">Pusat Bisnis Pre-Order, Catering & Kuliner Nusantara</p>
            <p className="text-xs text-slate-400">Jl. Pahlawan Seribu No. 88, BSD City, Tangerang • NPWP / NMID: ID1020039281729</p>
          </div>

          <div className="sm:text-right">
            <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Laporan Akuntansi Resmi
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Periode: {selectedMonth}</p>
            <p className="text-xs text-slate-400">Dicetak: {formatDateIndo(new Date().toISOString(), true)}</p>
          </div>
        </div>

        {/* Executive Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total Omset Penjualan</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatRupiah(totalRevenue)}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Total HPP / Bahan Baku</span>
            <p className="text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5">{formatRupiah(totalCost)}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Laba Kotor Usaha</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupiah(grossProfit)}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Pesanan Selesai / Terpenuhi</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{validOrders.length} Pesanan</p>
          </div>
        </div>

        {/* Payment Channels Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Rekapitulasi Kanal Pembayaran Masuk
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">QRIS Merchant</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{formatRupiah(paymentBreakdown.qris)}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Transfer Bank</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{formatRupiah(paymentBreakdown.bank)}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">E-Wallet</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{formatRupiah(paymentBreakdown.ewallet)}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Tunai / Kasir Toko</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{formatRupiah(paymentBreakdown.cash)}</p>
            </div>
          </div>
        </div>

        {/* Transaction Detail Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Rincian Buku Kas Transaksi Periode Ini ({monthOrders.length} Pesanan)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">No. Pesanan</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-right">Diskon</th>
                  <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                  <th className="py-2.5 px-3">Metode & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthOrders.map(o => (
                  <tr key={o.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{o.id}</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatShortDate(o.createdAt)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{o.customerName}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatRupiah(o.subtotal)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-500">
                      {o.discountAmount > 0 ? `-${formatRupiah(o.discountAmount)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatRupiah(o.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-300">
                      {o.paymentMethod.replace('_', ' ')} • {o.paymentStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Signatures */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
          <div>
            <p className="text-slate-400">Dibuat oleh:</p>
            <div className="h-14"></div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Dimas Pratama</p>
            <p className="text-[10px] text-slate-400">Kasir / Front-Desk</p>
          </div>
          <div>
            <p className="text-slate-400">Diverifikasi oleh:</p>
            <div className="h-14"></div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Siti Nurhaliza</p>
            <p className="text-[10px] text-slate-400">Manajer Operasional</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-slate-400">Disetujui oleh:</p>
            <div className="h-14"></div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Hendra Setiawan</p>
            <p className="text-[10px] text-slate-400">Owner & Direktur Utama</p>
          </div>
        </div>
      </div>

    </div>
  );
};
