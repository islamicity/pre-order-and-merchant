import React, { useState } from 'react';
import {
  X,
  Phone,
  Printer,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  AlertCircle,
  FileText,
  ExternalLink,
  Upload,
  QrCode,
  ShieldAlert,
  Send
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, User } from '../types';
import { formatRupiah, formatDateIndo, getWhatsAppUrl } from '../utils/formatters';
import { soundManager } from '../utils/audioNotification';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  currentUser: User;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus, proofUrl?: string) => void;
  onOpenReceipt: (order: Order) => void;
  onOpenQrisPayment?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  currentUser,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onOpenReceipt,
  onOpenQrisPayment,
}) => {
  if (!order) return null;

  const [customProofInput, setCustomProofInput] = useState(order.paymentProofUrl || '');
  const [showProofUpload, setShowProofUpload] = useState(false);

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_confirmation':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Menunggu Konfirmasi</span>;
      case 'in_production':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Sedang Diproduksi / Dapur</span>;
      case 'ready_for_dispatch':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">Siap Kirim / Diambil</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Selesai / Terkirim</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">Draft</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid_full':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Lunas (100%)</span>;
      case 'dp_verified':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">DP Terverifikasi</span>;
      case 'unpaid':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Belum Bayar</span>;
      default:
        return null;
    }
  };

  // WhatsApp Message Composer
  const waMessage = `Halo kak ${order.customerName}, terima kasih telah memesan di *Taman Kuliner Islamicity*!\n\n` +
    `*Nomor Pesanan:* ${order.id}\n` +
    `*Status PO:* ${order.orderStatus.toUpperCase()}\n` +
    `*Estimasi Jadi:* ${formatDateIndo(order.estimatedReadyDate)}\n` +
    `*Total Tagihan:* ${formatRupiah(order.totalAmount)}\n` +
    (order.remainingAmount > 0 ? `*Sisa Pembayaran (Pelunasan):* ${formatRupiah(order.remainingAmount)}\n` : `*Status:* LUNAS (Terverifikasi)\n`) +
    `\nBila ada pertanyaan atau konfirmasi pengiriman, silakan balas pesan ini. Terima kasih!`;

  const handleVerifyPayment = (type: 'dp' | 'full') => {
    soundManager.playSuccessPaymentSound();
    if (type === 'full') {
      onUpdatePaymentStatus(order.id, 'paid_full', customProofInput || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80');
      if (order.orderStatus === 'pending_confirmation') {
        onUpdateOrderStatus(order.id, 'in_production');
      }
    } else {
      onUpdatePaymentStatus(order.id, 'dp_verified', customProofInput || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80');
      if (order.orderStatus === 'pending_confirmation') {
        onUpdateOrderStatus(order.id, 'in_production');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">Invoice:</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">{order.id}</h2>
              {getOrderStatusBadge(order.orderStatus)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dibuat {formatDateIndo(order.createdAt, true)} oleh {order.cashierStaffName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReceipt(order)}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Struk / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Workflow Progress Stepper */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Alur Status Produksi Pre-Order
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onUpdateOrderStatus(order.id, 'pending_confirmation')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  order.orderStatus === 'pending_confirmation'
                    ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>1. Menunggu Konfirmasi</span>
                </div>
              </button>

              <button
                onClick={() => onUpdateOrderStatus(order.id, 'in_production')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  order.orderStatus === 'in_production'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>2. Masuk Produksi / Dapur</span>
                </div>
              </button>

              <button
                onClick={() => onUpdateOrderStatus(order.id, 'ready_for_dispatch')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  order.orderStatus === 'ready_for_dispatch'
                    ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>3. Siap Diambil / Kirim</span>
                </div>
              </button>

              <button
                onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${
                  order.orderStatus === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>4. Pesanan Selesai</span>
                </div>
              </button>
            </div>
          </div>

          {/* Customer & Fulfillment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Informasi Pelanggan</h4>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{order.customerName}</p>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="font-mono">{order.customerPhone}</span>
                <a
                  href={getWhatsAppUrl(order.customerPhone, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 text-[11px] transition"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Notifikasi WA</span>
                </a>
              </div>
              {order.customerEmail && <p className="text-xs text-slate-500">{order.customerEmail}</p>}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500">Metode Pengiriman: </span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {order.deliveryMethod === 'delivery' ? 'Kurir / Ekspedisi' : 'Ambil di Toko'}
                </strong>
                {order.shippingAddress && <p className="text-slate-600 dark:text-slate-300 mt-1 italic">{order.shippingAddress}</p>}
              </div>
            </div>

            {/* Payment & QRIS Verification Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  Status & Bukti Pembayaran QRIS
                </h4>
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{order.paymentMethod.replace('_', ' ')}</span>
                </div>
                {order.paymentMethod === 'qris' && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Kode Unik Verifikasi:</span>
                    <span className="font-mono font-bold">+{order.uniqueCode}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>DP Dibayar:</span>
                  <span>{formatRupiah(order.dpAmount)}</span>
                </div>
                {order.remainingAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Sisa Pelunasan:</span>
                    <span>{formatRupiah(order.remainingAmount)}</span>
                  </div>
                )}
              </div>

              {/* Bukti Bayar Preview & Actions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                {order.paymentProofUrl ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={order.paymentProofUrl}
                      alt="Bukti Transfer"
                      className="w-12 h-12 rounded object-cover border border-slate-300 dark:border-slate-600 cursor-pointer"
                      onClick={() => window.open(order.paymentProofUrl, '_blank')}
                      title="Klik untuk memperbesar bukti transfer"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Bukti Transfer Tersedia</p>
                      <a
                        href={order.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Lihat Bukti Full Resolusi</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Belum ada unggahan bukti slip transfer QRIS.</p>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleVerifyPayment('dp')}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-center"
                  >
                    Verifikasi DP
                  </button>
                  <button
                    onClick={() => handleVerifyPayment('full')}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-center"
                  >
                    Verifikasi LUNAS
                  </button>
                </div>

                {onOpenQrisPayment && order.paymentStatus !== 'paid_full' && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQrisPayment(order);
                      onClose();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 transition flex items-center justify-center gap-1.5 text-xs"
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Tampilkan Kode QRIS Dinamis Pesanan Ini</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Rincian Produk Pesanan
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.productName}
                        {item.variantName && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            Varian: {item.variantName}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{formatRupiah(item.price)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {order.notes && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300">Catatan Khusus Pelanggan:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
