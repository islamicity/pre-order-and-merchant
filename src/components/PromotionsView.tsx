import React, { useState } from 'react';
import {
  Tag,
  Gift,
  PlusCircle,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Percent,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Coupon, CustomerLoyalty, User } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface PromotionsViewProps {
  coupons: Coupon[];
  loyaltyCustomers: CustomerLoyalty[];
  currentUser: User;
  onAddCoupon: (coupon: Coupon) => void;
  onToggleCoupon: (couponId: string) => void;
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({
  coupons,
  loyaltyCustomers,
  currentUser,
  onAddCoupon,
  onToggleCoupon,
}) => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'loyalty'>('coupons');
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);

  // New Coupon State
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState(15);
  const [newMinSpend, setNewMinSpend] = useState(150000);
  const [newMaxDiscount, setNewMaxDiscount] = useState(50000);
  const [newQuota, setNewQuota] = useState(50);
  const [newValidUntil, setNewValidUntil] = useState('2026-11-30');
  const [isEarlyBird, setIsEarlyBird] = useState(true);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      alert('Kode kupon wajib diisi');
      return;
    }

    const created: Coupon = {
      id: `cpn-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      description: newDesc.trim() || 'Kupon Promosi Pre-Order',
      type: newType,
      value: newValue,
      minSpend: newMinSpend,
      maxDiscount: newType === 'percentage' ? newMaxDiscount : undefined,
      quota: newQuota,
      usedCount: 0,
      validUntil: newValidUntil,
      isEarlyBirdPo: isEarlyBird,
      isActive: true,
    };

    onAddCoupon(created);
    setShowAddCouponModal(false);
    setNewCode('');
    setNewDesc('');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300';
      case 'Gold':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      case 'Silver':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-emerald-500" />
            Manajemen Diskon, Promosi PO & Loyalitas Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Dorong antusiasme pemesanan pre-order dengan diskon Early Bird fleksibel dan program poin langganan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCouponModal(true)}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Kupon Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'coupons' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Kupon & Diskon Pre-Order ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'loyalty' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Pelanggan Setia & Poin Loyalitas ({loyaltyCustomers.length})
        </button>
      </div>

      {activeTab === 'coupons' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => {
            const usagePercent = Math.min(100, Math.round((coupon.usedCount / coupon.quota) * 100));

            return (
              <div
                key={coupon.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-3 py-1 font-mono font-black text-sm tracking-wider rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {coupon.code}
                    </span>
                    {coupon.isEarlyBirdPo && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Early Bird PO
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-3">{coupon.description}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Nilai Diskon: <strong className="text-emerald-600 font-bold">
                      {coupon.type === 'percentage' ? `${coupon.value}% (Maks ${formatRupiah(coupon.maxDiscount || 0)})` : formatRupiah(coupon.value)}
                    </strong>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Minimal Belanja: <strong>{formatRupiah(coupon.minSpend)}</strong>
                  </p>

                  {/* Quota Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Kuota Terpakai:</span>
                      <span className="font-bold">{coupon.usedCount} / {coupon.quota} ({usagePercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Berlaku s/d: {formatDateIndo(coupon.validUntil)}</span>
                  <button
                    onClick={() => onToggleCoupon(coupon.id)}
                    className={`px-3 py-1 font-semibold rounded-lg transition ${
                      coupon.isActive
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {coupon.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Loyalty Program Directory */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                Direktori Pelanggan Setia & Akumulasi Poin
              </h3>
              <p className="text-xs text-slate-500">Otomatis dihitung dari frekuensi pesanan pre-order</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Pelanggan</th>
                  <th className="py-3 px-4">Kontak WhatsApp</th>
                  <th className="py-3 px-4">Tier Membership</th>
                  <th className="py-3 px-4 text-center">Poin Loyalitas</th>
                  <th className="py-3 px-4 text-center">Total Transaksi</th>
                  <th className="py-3 px-4 text-right">Total Belanja (LTV)</th>
                  <th className="py-3 px-4">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {loyaltyCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cust.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{cust.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(cust.tier)}`}>
                        {cust.tier} Member
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 font-mono">
                      {cust.points} pts
                    </td>
                    <td className="py-3 px-4 text-center">{cust.totalOrders} order</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatRupiah(cust.totalSpend)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDateIndo(cust.joinedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Buat Kupon Diskon Pre-Order Baru</h3>
              <button onClick={() => setShowAddCouponModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Kode Kupon (Huruf Kapital) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PROMOLEBARAN"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Deskripsi Promo</label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon 15% Pre-Order Batch 3"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tipe Potongan</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Rupiah (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Besaran Diskon</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={e => setNewValue(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    value={newMinSpend}
                    onChange={e => setNewMinSpend(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kuota Kupon</label>
                  <input
                    type="number"
                    value={newQuota}
                    onChange={e => setNewQuota(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="eb-checkbox"
                  checked={isEarlyBird}
                  onChange={e => setIsEarlyBird(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="eb-checkbox" className="font-semibold text-slate-700 dark:text-slate-300">
                  Tandai sebagai Promosi Khusus Early Bird Pre-Order
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Kupon Promosi</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
