import React, { useState } from 'react';
import {
  ShoppingBag,
  Filter,
  PlusCircle,
  Search,
  Calendar,
  Clock,
  Printer,
  Eye,
  CheckCircle2,
  Send,
  AlertCircle,
  Truck,
  ArrowUpDown,
  FileSpreadsheet,
  QrCode
} from 'lucide-react';
import { Order, OrderStatus, Product, User } from '../types';
import { formatRupiah, formatDateIndo, formatShortDate, getWhatsAppUrl } from '../utils/formatters';
import { exportOrdersToCsv, copyForGoogleSheets } from '../utils/exportUtils';

interface PreOrderViewProps {
  orders: Order[];
  products: Product[];
  currentUser: User;
  onOpenNewOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
  onOpenQrisPayment?: (order: Order) => void;
  searchQuery: string;
}

export const PreOrderView: React.FC<PreOrderViewProps> = ({
  orders,
  products,
  currentUser,
  onOpenNewOrder,
  onSelectOrder,
  onOpenReceipt,
  onOpenQrisPayment,
  searchQuery,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [copySuccess, setCopySuccess] = useState(false);

  // Extract distinct batch names
  const availableBatches = Array.from(
    new Set(products.map(p => p.batchName).filter(Boolean) as string[])
  );

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchItem = o.items.some(i => i.productName.toLowerCase().includes(q));
      if (!matchId && !matchCust && !matchPhone && !matchItem) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && !(o.orderStatus === 'pending_confirmation' || o.paymentStatus === 'unpaid')) return false;
      if (statusFilter === 'in_production' && o.orderStatus !== 'in_production') return false;
      if (statusFilter === 'ready_for_dispatch' && o.orderStatus !== 'ready_for_dispatch') return false;
      if (statusFilter === 'completed' && o.orderStatus !== 'completed') return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (dateFilter === 'today') {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === '7d') {
        const diff = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diff > 7) return false;
      } else if (dateFilter === '30d') {
        const diff = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diff > 30) return false;
      }
    }

    // Batch filter
    if (batchFilter !== 'all') {
      const matchBatch = o.items.some(item => {
        const prod = products.find(p => p.id === item.productId);
        return prod?.batchName === batchFilter;
      });
      if (!matchBatch) return false;
    }

    return true;
  });

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Menunggu Verifikasi</span>;
      case 'in_production':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Dalam Produksi</span>;
      case 'ready_for_dispatch':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">Siap Kirim</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Selesai</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Batal</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-800">Draft</span>;
    }
  };

  const handleCopySheets = async () => {
    const success = await copyForGoogleSheets(filteredOrders);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-500" />
            Manajemen Sistem Pre-Order (PO)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kelola alur batch PO, verifikasi DP QRIS, jadwal siap kirim, dan cetak invoice pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySheets}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition"
            title="Salin data format siap tempel ke Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{copySuccess ? '✓ Tersalin ke Clipboard' : 'Salin Google Sheets'}</span>
          </button>

          <button
            onClick={() => exportOrdersToCsv(filteredOrders)}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition"
          >
            <span>Ekspor Excel (.csv)</span>
          </button>

          <button
            onClick={onOpenNewOrder}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Pesanan PO Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-emerald-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-amber-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Perlu Verifikasi ({orders.filter(o => o.orderStatus === 'pending_confirmation' || o.paymentStatus === 'unpaid').length})
            </button>
            <button
              onClick={() => setStatusFilter('in_production')}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'in_production' ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Produksi ({orders.filter(o => o.orderStatus === 'in_production').length})
            </button>
            <button
              onClick={() => setStatusFilter('ready_for_dispatch')}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'ready_for_dispatch' ? 'bg-white dark:bg-slate-900 text-teal-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Siap Kirim ({orders.filter(o => o.orderStatus === 'ready_for_dispatch').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'completed' ? 'bg-white dark:bg-slate-900 text-emerald-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Selesai ({orders.filter(o => o.orderStatus === 'completed').length})
            </button>
          </div>

          {/* Date & Batch Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>

            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none max-w-xs truncate"
            >
              <option value="all">Semua Batch Pre-Order</option>
              {availableBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">No. Pesanan</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Item PO</th>
                <th className="py-3 px-4">Estimasi Ready</th>
                <th className="py-3 px-4">Total & Skema</th>
                <th className="py-3 px-4">Status Bayar</th>
                <th className="py-3 px-4">Status PO</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data pesanan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    {/* ID */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {order.id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatShortDate(order.createdAt)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {order.customerName}
                      </p>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {order.customerPhone}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4">
                      <div className="max-w-[200px]">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <p key={idx} className="truncate text-slate-700 dark:text-slate-300">
                            • {item.productName} (x{item.quantity})
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            +{order.items.length - 2} produk lainnya
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estimated Ready */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatShortDate(order.estimatedReadyDate)}
                      </span>
                      <span className="text-[10px] text-slate-400 block capitalize">
                        {order.deliveryMethod === 'delivery' ? 'Kirim Kurir' : 'Ambil Toko'}
                      </span>
                    </td>

                    {/* Total & DP */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(order.totalAmount)}
                      </p>
                      {order.remainingAmount > 0 ? (
                        <span className="text-[10px] text-blue-600 font-semibold block">
                          DP: {formatRupiah(order.dpAmount)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          Lunas 100%
                        </span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4">
                      <span className="capitalize text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                        {order.paymentMethod.toUpperCase()} (+{order.uniqueCode})
                      </span>
                      {order.paymentStatus === 'paid_full' ? (
                        <span className="text-[10px] text-emerald-600 font-bold">LUNAS</span>
                      ) : order.paymentStatus === 'dp_verified' ? (
                        <span className="text-[10px] text-blue-600 font-bold">DP OK</span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold">BELUM BAYAR</span>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="py-3 px-4">
                      {getOrderStatusBadge(order.orderStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenQrisPayment && order.paymentStatus !== 'paid_full' && (
                          <button
                            onClick={() => onOpenQrisPayment(order)}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            title="Generate QRIS Dinamis Pesanan Ini"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Lihat Detail Pesanan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenReceipt(order)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Cetak Struk"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <a
                          href={getWhatsAppUrl(order.customerPhone, `Halo ${order.customerName}, update pesanan PO ${order.id}: ${order.orderStatus}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          title="Hubungi Pelanggan via WhatsApp"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
