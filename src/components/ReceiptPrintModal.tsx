import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { Order } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface ReceiptPrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-auto">
        
        {/* Modal Controls (No print) */}
        <div className="no-print p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Pratinjau Struk & Invoice Resmi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 bg-white text-slate-950 font-mono text-xs printable-card">
          
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-400">
            <h2 className="text-base font-black tracking-wider uppercase">TAMAN KULINER ISLAMICITY</h2>
            <p className="text-[11px] text-slate-600">Pusat Kuliner & Pre-Order Nusantara</p>
            <p className="text-[10px] text-slate-500">Jl. Pahlawan Seribu No. 88, BSD City, Tangerang</p>
            <p className="text-[10px] text-slate-500">WhatsApp: 0812-9876-5432</p>
          </div>

          {/* Meta Info */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span className="font-bold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal Order:</span>
              <span>{formatDateIndo(order.createdAt, true)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>WhatsApp:</span>
              <span>{order.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode:</span>
              <span>{order.deliveryMethod === 'delivery' ? 'Kirim Ekspedisi' : 'Ambil di Toko'}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimasi Selesai:</span>
              <span className="font-bold">{formatDateIndo(order.estimatedReadyDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{order.cashierStaffName}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between font-bold">
                  <span>{item.productName}</span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>{item.variantName ? `[${item.variantName}] ` : ''}{item.quantity} x {formatRupiah(item.price)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Breakdown */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Diskon Kupon ({order.discountCode}):</span>
                <span>-{formatRupiah(order.discountAmount)}</span>
              </div>
            )}
            {order.paymentMethod === 'qris' && (
              <div className="flex justify-between text-slate-700">
                <span>Kode Unik QRIS:</span>
                <span>+{order.uniqueCode}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
              <span>TOTAL AKHIR:</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1">
              <span>Uang Muka / DP:</span>
              <span>{formatRupiah(order.dpAmount)}</span>
            </div>
            {order.remainingAmount > 0 ? (
              <div className="flex justify-between font-bold text-rose-700">
                <span>Sisa Pelunasan:</span>
                <span>{formatRupiah(order.remainingAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Status:</span>
                <span>LUNAS 100%</span>
              </div>
            )}
          </div>

          {/* Payment Method & Stamp */}
          <div className="py-3 text-center space-y-1 text-[11px]">
            <p className="font-bold uppercase tracking-wider">
              Metode: {order.paymentMethod.replace('_', ' ')} • Status: {order.paymentStatus.toUpperCase()}
            </p>
            <p className="text-[10px] text-slate-500">
              NMID: ID1020039281729 - Merchant QRIS Resmi
            </p>
            <p className="text-[10px] text-slate-500 pt-2 italic">
              "Terima kasih atas kepercayaan Anda memesan pre-order di Taman Kuliner Islamicity!"
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
