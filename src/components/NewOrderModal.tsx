import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Tag,
  Calendar,
  User as UserIcon,
  Phone,
  MapPin,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Banknote
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Order, OrderItem, Coupon, PaymentMethod, User } from '../types';
import {
  formatRupiah,
  generateOrderId,
  generateUniquePaymentCode,
  formatShortDate
} from '../utils/formatters';
import { soundManager } from '../utils/audioNotification';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  coupons: Coupon[];
  currentUser: User;
  onSaveOrder: (newOrder: Order) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  coupons,
  currentUser,
  onSaveOrder,
}) => {
  if (!isOpen) return null;

  // Selected items in cart
  const [selectedItems, setSelectedItems] = useState<{
    productId: string;
    variantId?: string;
    quantity: number;
  }[]>([]);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  // PO & Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [payType, setPayType] = useState<'dp' | 'full'>('dp');
  const [dpPercentage, setDpPercentage] = useState<number>(50);
  const [estimatedReadyDate, setEstimatedReadyDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  // Coupon
  const [inputCoupon, setInputCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Generate Unique Code for QRIS verification
  const [uniqueCode] = useState(() => generateUniquePaymentCode());

  // Available active products
  const activeProducts = products.filter(p => p.isActive);

  // Cart calculations
  const cartItems: OrderItem[] = selectedItems.map(item => {
    const prod = products.find(p => p.id === item.productId)!;
    const variant = item.variantId ? prod.variants.find(v => v.id === item.variantId) : undefined;
    const itemPrice = prod.price + (variant ? variant.additionalPrice : 0);
    return {
      productId: prod.id,
      productName: prod.name,
      variantId: item.variantId,
      variantName: variant?.name,
      quantity: item.quantity,
      price: itemPrice,
      costPrice: prod.costPrice,
      subtotal: itemPrice * item.quantity,
    };
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Apply Coupon
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  // Final Total & DP
  const totalAmount = Math.max(0, subtotal - discountAmount) + (paymentMethod === 'qris' ? uniqueCode : 0);
  const dpAmount = payType === 'dp' ? Math.round((totalAmount * dpPercentage) / 100) : totalAmount;
  const remainingAmount = totalAmount - dpAmount;

  const handleAddItem = (productId: string, variantId?: string) => {
    const existingIndex = selectedItems.findIndex(
      i => i.productId === productId && i.variantId === variantId
    );

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (existingIndex > -1) {
      const currentQty = selectedItems[existingIndex].quantity;
      if (currentQty >= prod.stock) {
        alert(`Batas stok/kuota maksimum tercapai (${prod.stock} unit)`);
        return;
      }
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      if (prod.stock <= 0) {
        alert('Stok atau kuota pre-order produk ini sudah habis');
        return;
      }
      setSelectedItems([...selectedItems, { productId, variantId, quantity: 1 }]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const target = selectedItems[index];
    const prod = products.find(p => p.id === target.productId);
    if (!prod) return;

    const newQty = target.quantity + delta;
    if (newQty <= 0) {
      setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
    } else if (newQty > prod.stock) {
      alert(`Batas stok/kuota maksimum tercapai (${prod.stock} unit)`);
    } else {
      const updated = [...selectedItems];
      updated[index].quantity = newQty;
      setSelectedItems(updated);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const found = coupons.find(c => c.code.toUpperCase() === inputCoupon.trim().toUpperCase() && c.isActive);
    if (!found) {
      setCouponError('Kode kupon tidak valid atau sudah kedaluwarsa');
      return;
    }
    if (subtotal < found.minSpend) {
      setCouponError(`Minimal belanja untuk kupon ini adalah ${formatRupiah(found.minSpend)}`);
      return;
    }
    setAppliedCoupon(found);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      alert('Pilih minimal 1 produk pre-order atau ready stock');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Nama dan Nomor WhatsApp pelanggan wajib diisi');
      return;
    }

    const newOrder: Order = {
      id: generateOrderId('PO'),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      deliveryMethod,
      shippingAddress: deliveryMethod === 'delivery' ? shippingAddress : 'Ambil di Toko',
      items: cartItems,
      subtotal,
      discountAmount,
      discountCode: appliedCoupon?.code,
      uniqueCode: paymentMethod === 'qris' ? uniqueCode : 0,
      totalAmount,
      dpAmount,
      remainingAmount,
      paymentMethod,
      paymentStatus: 'unpaid',
      orderStatus: 'pending_confirmation',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cashierStaffName: currentUser.name,
      estimatedReadyDate,
    };

    // Confetti celebration & sound chime
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      soundManager.playNewOrderSound();
    } catch {
      // ignore
    }

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header Modal */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Buat Pesanan Pre-Order / POS Baru</h2>
              <p className="text-xs text-emerald-100">Kasir: {currentUser.name} • Kode Unik QRIS Otomatis: +{uniqueCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Product Picker (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Pilih Produk Katalog & Batch PO
              </h3>
              <span className="text-xs text-slate-400">Klik item untuk menambah</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
              {activeProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-800/40 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        product.type === 'preorder' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {product.type === 'preorder' ? 'PO' : 'Ready'}
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">{product.name}</p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(product.price)}</p>
                    </div>
                  </div>

                  {/* Variants buttons or direct add */}
                  {product.variants.length > 0 ? (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                      <p className="text-[10px] text-slate-400 font-medium">Pilih Varian:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleAddItem(product.id, v.id)}
                            className="px-2 py-1 text-[11px] rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-slate-700 dark:text-slate-200 transition"
                          >
                            + {v.name} {v.additionalPrice > 0 ? `(+${formatRupiah(v.additionalPrice)})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddItem(product.id)}
                      className="w-full mt-2 py-1 px-2 text-xs font-medium rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Item</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Items Cart List */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                Keranjang Pesanan ({selectedItems.length} Produk)
              </h4>

              {selectedItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  Keranjang masih kosong. Pilih produk di atas.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.variantName ? `${item.variantName} • ` : ''}{formatRupiah(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="p-1 text-slate-500 hover:text-rose-500"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="p-1 text-slate-500 hover:text-emerald-500"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-24 text-right">
                          {formatRupiah(item.subtotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -item.quantity)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kupon & Promosi */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Gunakan Kode Diskon / Kupon PO</span>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: EARLYPO15"
                  value={inputCoupon}
                  onChange={e => setInputCoupon(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Terapkan
                </button>
              </div>
              {couponError && <p className="text-[11px] text-rose-500 mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  ✓ Kupon {appliedCoupon.code} berhasil dipasang ({appliedCoupon.description})
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Customer & Payment Details (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-emerald-500" />
              Data Pelanggan & Pengiriman
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap pemesan"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Nomor WhatsApp *</label>
                <div className="relative mt-1">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxx"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Delivery method toggle */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Metode Pengambilan</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition ${deliveryMethod === 'pickup' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    Ambil di Toko
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition ${deliveryMethod === 'delivery' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    Kirim Kurir / Ekspedisi
                  </button>
                </div>
              </div>

              {deliveryMethod === 'delivery' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Alamat Pengiriman</label>
                  <textarea
                    rows={2}
                    placeholder="Alamat lengkap tujuan pengiriman..."
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Estimated Fulfillment Date */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Estimasi Tanggal Jadi / Pengiriman PO
                </label>
                <input
                  type="date"
                  value={estimatedReadyDate}
                  onChange={e => setEstimatedReadyDate(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Payment Settings */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${paymentMethod === 'qris' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS Merchant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${paymentMethod === 'bank_transfer' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Transfer Bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ewallet')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${paymentMethod === 'ewallet' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    <span>E-Wallet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tunai / Kasir</span>
                  </button>
                </div>
              </div>

              {/* DP vs Lunas Toggle */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Skema Bayar Pre-Order</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPayType('dp')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition ${payType === 'dp' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    Uang Muka (DP 50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType('full')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition ${payType === 'full' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}
                  >
                    Bayar Lunas (100%)
                  </button>
                </div>
              </div>

              {/* Total Calculation Breakdown Card */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Produk:</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-500 font-medium">
                    <span>Diskon Kupon ({appliedCoupon?.code}):</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
                {paymentMethod === 'qris' && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Kode Unik Verifikasi QRIS:</span>
                    <span>+{formatRupiah(uniqueCode)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(totalAmount)}</span>
                </div>
                {payType === 'dp' && (
                  <div className="pt-1 flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Tagihan DP Hari Ini (50%):</span>
                    <span>{formatRupiah(dpAmount)}</span>
                  </div>
                )}
              </div>

            </div>

            <button
              type="button"
              onClick={handleSubmitOrder}
              className="w-full mt-4 py-2.5 px-4 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Konfirmasi & Simpan Pesanan PO</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
