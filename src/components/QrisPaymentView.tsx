import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Save,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  DollarSign,
  Download,
  Printer,
  Send,
  Search,
  Check,
  ArrowRight,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { QrisMerchantConfig, Order, User } from '../types';
import {
  formatRupiah,
  generateQrisString,
  formatDateIndo,
  formatShortDate,
  getWhatsAppUrl
} from '../utils/formatters';
import { soundManager } from '../utils/audioNotification';

interface QrisPaymentViewProps {
  qrisConfig: QrisMerchantConfig;
  onUpdateConfig: (config: QrisMerchantConfig) => void;
  orders: Order[];
  onVerifyOrderPayment: (orderId: string, status?: 'dp_verified' | 'paid_full') => void;
  currentUser: User;
  targetOrder?: Order | null;
}

export const QrisPaymentView: React.FC<QrisPaymentViewProps> = ({
  qrisConfig,
  onUpdateConfig,
  orders,
  onVerifyOrderPayment,
  currentUser,
  targetOrder,
}) => {
  // Config form state
  const [merchantName, setMerchantName] = useState(qrisConfig.merchantName);
  const [nmid, setNmid] = useState(qrisConfig.nmid);
  const [city, setCity] = useState(qrisConfig.city);
  const [bankName, setBankName] = useState(qrisConfig.bankName);
  const [accountNumber, setAccountNumber] = useState(qrisConfig.accountNumber);
  const [accountHolder, setAccountHolder] = useState(qrisConfig.accountHolder);
  const [useUniqueCode, setUseUniqueCode] = useState(qrisConfig.useUniqueCode);
  const [isSaved, setIsSaved] = useState(false);

  // Mode: 'order_specific' (Berdasarkan Pesanan Spesifik) vs 'custom_pos' (Input Nominal Bebas)
  const [generatorMode, setGeneratorMode] = useState<'order_specific' | 'custom_pos'>('order_specific');

  // Selected Order for Dynamic QR
  const unpaidOrders = orders.filter(o => o.paymentStatus !== 'paid_full' && o.orderStatus !== 'cancelled');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (targetOrder?.id) return targetOrder.id;
    return unpaidOrders.length > 0 ? unpaidOrders[0].id : (orders[0]?.id || '');
  });

  // Sync when targetOrder prop changes from outside
  useEffect(() => {
    if (targetOrder?.id) {
      setSelectedOrderId(targetOrder.id);
      setGeneratorMode('order_specific');
    }
  }, [targetOrder]);
  
  // Payment Type for Selected Order: 'full' | 'dp' | 'remaining'
  const [orderPayType, setOrderPayType] = useState<'full' | 'dp' | 'remaining'>('full');

  // Order search/filter
  const [orderSearchText, setOrderSearchText] = useState('');

  // Manual Custom POS state
  const [posAmount, setPosAmount] = useState<number>(185000);
  const [posCustomer, setPosCustomer] = useState('Pelanggan Kasir');
  const [posUniqueCode, setPosUniqueCode] = useState(137);

  // Simulation & Scan State
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    orderId?: string;
    customerName: string;
    amount: number;
    timestamp: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Selected Order Object
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Calculate the EXACT dynamic amount to embed into QRIS
  let dynamicPayAmount = 0;
  let dynamicCustomerName = '';
  let dynamicOrderReference: string | undefined = undefined;
  let dynamicUniqueCode = 0;

  if (generatorMode === 'order_specific' && selectedOrder) {
    dynamicOrderReference = selectedOrder.id;
    dynamicCustomerName = selectedOrder.customerName;
    dynamicUniqueCode = selectedOrder.uniqueCode;

    if (orderPayType === 'dp') {
      dynamicPayAmount = selectedOrder.dpAmount;
    } else if (orderPayType === 'remaining') {
      dynamicPayAmount = selectedOrder.remainingAmount > 0 ? selectedOrder.remainingAmount : selectedOrder.totalAmount;
    } else {
      dynamicPayAmount = selectedOrder.totalAmount;
    }
  } else {
    dynamicPayAmount = posAmount + (useUniqueCode ? posUniqueCode : 0);
    dynamicCustomerName = posCustomer;
    dynamicUniqueCode = posUniqueCode;
  }

  // Filter orders needing verification
  const pendingOrders = orders.filter(
    o => o.paymentMethod === 'qris' && (o.paymentStatus === 'unpaid' || o.paymentStatus === 'dp_verified')
  );

  // Filter selectable orders
  const filteredSelectableOrders = unpaidOrders.filter(o => {
    if (!orderSearchText) return true;
    const q = orderSearchText.toLowerCase();
    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
  });

  // Re-generate QR Code on canvas whenever parameters change
  useEffect(() => {
    if (!canvasRef.current) return;

    const qrisData = generateQrisString({
      merchantName,
      nmid,
      city,
      amount: dynamicPayAmount,
      orderId: dynamicOrderReference,
    });

    QRCode.toCanvas(
      canvasRef.current,
      qrisData,
      {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      err => {
        if (err) console.error('QR code generation error', err);
      }
    );
  }, [
    dynamicPayAmount,
    dynamicOrderReference,
    merchantName,
    nmid,
    city,
    generatorMode,
    orderPayType,
    selectedOrderId
  ]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...qrisConfig,
      merchantName: merchantName.trim().toUpperCase(),
      nmid: nmid.trim(),
      city: city.trim().toUpperCase(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim(),
      useUniqueCode,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Simulate Customer Scan & Instant Webhook Notification for the EXACT active QR
  const handleSimulatePayment = () => {
    setIsSimulatingScan(true);

    setTimeout(() => {
      setIsSimulatingScan(false);
      setPaymentSuccessData({
        orderId: dynamicOrderReference,
        customerName: dynamicCustomerName,
        amount: dynamicPayAmount,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });

      // If an active order was selected, automatically update its payment status
      if (selectedOrder) {
        const nextStatus = orderPayType === 'dp' ? 'dp_verified' : 'paid_full';
        onVerifyOrderPayment(selectedOrder.id, nextStatus);
      }

      soundManager.playSuccessPaymentSound();
      try {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.65 },
        });
      } catch {
        // ignore
      }
    }, 2200);
  };

  const handleResetSimulator = () => {
    setPaymentSuccessData(null);
    setPosUniqueCode(Math.floor(100 + Math.random() * 800));
  };

  // Download QR Code as PNG image file
  const handleDownloadQrImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `QRIS-${dynamicOrderReference || 'Merchant'}-${dynamicPayAmount}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Print QR Sheet
  const handlePrintQr = () => {
    window.print();
  };

  // WhatsApp Message Composer for this specific QR
  const waPaymentMessage = selectedOrder
    ? `Halo kak *${selectedOrder.customerName}*,\n\n` +
      `Berikut adalah rincian tagihan pre-order Anda di *${merchantName}*:\n` +
      `• *Nomor Pesanan:* ${selectedOrder.id}\n` +
      `• *Tipe Pembayaran:* ${orderPayType === 'dp' ? 'Uang Muka (DP 50%)' : orderPayType === 'remaining' ? 'Pelunasan Sisa' : 'Pembayaran Penuh (100%)'}\n` +
      `• *Jumlah Tepat yang Harus Dibayar:* ${formatRupiah(dynamicPayAmount)}\n` +
      `• *Kode Unik Sistem:* +${dynamicUniqueCode}\n` +
      `• *Metode:* QRIS Merchant Resmi (${merchantName} - NMID: ${nmid})\n\n` +
      `Silakan scan kode QRIS kami melalui aplikasi BCA Mobile, Livin Mandiri, BRImo, BSI Mobile, GoPay, OVO, ShopeePay, atau DANA.\n` +
      `Jumlah tagihan telah diset tepat hingga digit rupiah terakhir untuk verifikasi otomatis. Terima kasih!`
    : `Halo, tagihan pembayaran QRIS Anda di ${merchantName} sebesar ${formatRupiah(dynamicPayAmount)}. Silakan scan QRIS resmi kami.`;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-500" />
            Generator QRIS Dinamis & Kasir Pre-Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hasilkan kode QRIS otomatis sesuai nominal pesanan spesifik agar pelanggan langsung scan dengan jumlah yang tepat tanpa ketik manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>NMID: {nmid} (QRIS Dinamis 010212 Aktif)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dynamic QRIS Generator & Interactive Terminal (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main QR Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            
            {/* Header: Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Generator QRIS Dinamis Interaktif
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nominal tagihan tertanam langsung di dalam kode QR
                  </p>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setGeneratorMode('order_specific')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    generatorMode === 'order_specific'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pilih Pesanan PO
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratorMode('custom_pos')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    generatorMode === 'custom_pos'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Kasir Nominal Bebas
                </button>
              </div>
            </div>

            {/* Mode 1: Order Specific Selector */}
            {generatorMode === 'order_specific' && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Pilih Pesanan Pre-Order Tujuan:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {unpaidOrders.length} pesanan belum lunas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <select
                      value={selectedOrderId}
                      onChange={e => setSelectedOrderId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      {filteredSelectableOrders.length === 0 ? (
                        <option value="">(Tidak ada pesanan tertunda)</option>
                      ) : (
                        filteredSelectableOrders.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.id} - {o.customerName} ({formatRupiah(o.totalAmount)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Payment Type Selection (Full vs DP vs Sisa) */}
                  <div className="sm:col-span-4 flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setOrderPayType('full')}
                      className={`flex-1 py-1.5 text-center transition ${orderPayType === 'full' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      title="Bayar Penuh"
                    >
                      Lunas
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPayType('dp')}
                      className={`flex-1 py-1.5 text-center transition ${orderPayType === 'dp' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      title="Uang Muka DP 50%"
                    >
                      DP
                    </button>
                    {selectedOrder && selectedOrder.paymentStatus === 'dp_verified' && (
                      <button
                        type="button"
                        onClick={() => setOrderPayType('remaining')}
                        className={`flex-1 py-1.5 text-center transition ${orderPayType === 'remaining' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        title="Pelunasan Sisa"
                      >
                        Sisa
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Order Summary Card */}
                {selectedOrder && (
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedOrder.id}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({selectedOrder.customerPhone})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {selectedOrder.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Jumlah Tagihan QR:</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(dynamicPayAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Custom Free POS Input */}
            {generatorMode === 'custom_pos' && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Nama Pelanggan Kasir</label>
                    <input
                      type="text"
                      value={posCustomer}
                      onChange={e => setPosCustomer(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Nominal Tagihan Pre-Order (Rp)</label>
                    <input
                      type="number"
                      value={posAmount}
                      onChange={e => setPosAmount(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-2 font-mono font-bold text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[50000, 100000, 150000, 250000, 385000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPosAmount(amt)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                        posAmount === amt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Display Generated QRIS & Interactive Visualizer */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Official QRIS Card UI Box (Printable & Scan Friendly) */}
              <div className="sm:col-span-6 p-5 rounded-2xl bg-gradient-to-b from-rose-700 via-rose-600 to-rose-800 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                {/* Header QRIS */}
                <div className="w-full flex items-center justify-between pb-2 border-b border-white/20 text-xs font-bold tracking-wider">
                  <span className="font-mono text-[11px] tracking-widest">QRIS DINAMIS</span>
                  <span className="text-[10px] text-white/90 bg-white/20 px-1.5 py-0.5 rounded">
                    TAGIHAN PAS
                  </span>
                </div>

                <div className="my-2">
                  <h3 className="font-bold text-sm tracking-wide">{merchantName}</h3>
                  <p className="text-[10px] text-rose-100 font-mono">NMID: {nmid}</p>
                  {dynamicOrderReference && (
                    <p className="text-[11px] font-mono font-bold text-emerald-200 mt-0.5">
                      No. Ref: {dynamicOrderReference}
                    </p>
                  )}
                </div>

                {/* QR Code Canvas */}
                <div className="p-3 bg-white rounded-2xl shadow-inner my-1 flex items-center justify-center">
                  <canvas ref={canvasRef} className="max-w-[210px] h-auto rounded" />
                </div>

                <div className="mt-2 text-center w-full">
                  <span className="text-[10px] text-rose-100 uppercase tracking-wider block font-medium">
                    NOMINAL TEPAT HARUS DIBAYAR:
                  </span>
                  <p className="text-xl font-black tracking-tight text-white font-mono">
                    {formatRupiah(dynamicPayAmount)}
                  </p>
                  <p className="text-[10px] text-emerald-200 mt-0.5">
                    {dynamicCustomerName ? `a.n ${dynamicCustomerName}` : 'Pelanggan Kasir'} • Kode: +{dynamicUniqueCode}
                  </p>
                </div>

                <div className="w-full mt-3 pt-2 border-t border-white/20 text-[9px] text-white/80 flex justify-between">
                  <span>BCA • BSI • Mandiri • BRI</span>
                  <span>GoPay • OVO • DANA • Shopee</span>
                </div>

                {/* Success Overlay after simulated scan */}
                {paymentSuccessData && (
                  <div className="absolute inset-0 bg-emerald-600/98 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white text-center animate-in fade-in duration-300 z-10">
                    <CheckCircle2 className="w-16 h-16 text-white mb-2 animate-bounce" />
                    <h4 className="text-lg font-black tracking-tight">PEMBAYARAN QRIS SUKSES!</h4>
                    <p className="text-xs text-emerald-100 mt-1">
                      Transaksi telah terverifikasi ke rekening merchant.
                    </p>
                    <p className="text-base font-black mt-2 font-mono">
                      {formatRupiah(paymentSuccessData.amount)}
                    </p>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      {paymentSuccessData.orderId ? `Order: ${paymentSuccessData.orderId}` : paymentSuccessData.customerName}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetSimulator}
                      className="mt-4 px-4 py-1.5 rounded-lg bg-white text-emerald-700 font-bold text-xs shadow-md hover:bg-emerald-50 transition"
                    >
                      Tutup / Transaksi Baru
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons & Simulator Controls */}
              <div className="sm:col-span-6 space-y-3.5 text-xs">
                
                {/* Action 1: Send via WhatsApp */}
                <a
                  href={getWhatsAppUrl(selectedOrder?.customerPhone || '', waPaymentMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Rincian & QR via WhatsApp</span>
                </a>

                {/* Action 2: Download QR as PNG */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrImage}
                    className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintQr}
                    className="py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak QR</span>
                  </button>
                </div>

                {/* Simulated Customer Payment Scan */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Simulasi Pelanggan Scan & Bayar:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Uji coba notifikasi pembayaran real-time ketika pelanggan memindai QR dinamis ini melalui m-banking dengan jumlah tepat <strong className="text-emerald-700 dark:text-emerald-300">{formatRupiah(dynamicPayAmount)}</strong>.
                  </p>

                  <button
                    type="button"
                    disabled={isSimulatingScan}
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-98"
                  >
                    {isSimulatingScan ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memproses Verifikasi Settlement Bank...</span>
                      </>
                    ) : (
                      <span>Simulasikan Scan & Verifikasi Otomatis</span>
                    )}
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Pending Pre-Order QRIS Verifications with 1-Click "Buat QR Dinamis" */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Daftar Pesanan Pre-Order Belum Lunas ({pendingOrders.length})
              </h3>
              <span className="text-[11px] text-slate-400">Pilih untuk langsung buatkan QR dinamis</span>
            </div>

            {pendingOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Semua pembayaran QRIS sudah terverifikasi lunas.</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      selectedOrderId === order.id && generatorMode === 'order_specific'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{order.id}</span>
                        <span className="font-bold text-emerald-600">{formatRupiah(order.totalAmount)}</span>
                        {order.remainingAmount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            DP: {formatRupiah(order.dpAmount)}
                          </span>
                        ) : null}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800">
                          Kode: +{order.uniqueCode}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 truncate">
                        {order.customerName} • {order.customerPhone} ({order.items.length} item)
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setGeneratorMode('order_specific');
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Tampilkan QR Dinamis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onVerifyOrderPayment(order.id, 'paid_full');
                          soundManager.playSuccessPaymentSound();
                        }}
                        className="px-2.5 py-1.5 font-bold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition text-xs"
                        title="Tandai Pembayaran Lunas Manual"
                      >
                        Verifikasi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: QRIS Merchant Profile & Bank Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-500" />
                Profil Merchant & Rekening Settlement
              </h3>
              {isSaved && <span className="text-xs text-emerald-600 font-bold">✓ Tersimpan!</span>}
            </div>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Nama Toko / Merchant QRIS</label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={e => setMerchantName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">National Merchant ID (NMID)</label>
                <input
                  type="text"
                  required
                  value={nmid}
                  onChange={e => setNmid(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kota Merchant</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kode Pos</label>
                  <input
                    type="text"
                    value={qrisConfig.postalCode}
                    readOnly
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
                  />
                </div>
              </div>

              {/* Rekening Penerima */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Rekening Settlement Bank</h4>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Nama Bank</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Nomor Rekening</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Atas Nama Pemilik</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={e => setAccountHolder(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Unique Code Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Gunakan Kode Unik Otomatis</span>
                  <p className="text-[11px] text-slate-500">
                    Menambahkan 3 digit angka unik pada tagihan untuk mempermudah deteksi transfer masuk
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={useUniqueCode}
                  onChange={e => setUseUniqueCode(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi QRIS</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
