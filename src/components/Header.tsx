import React, { useState } from 'react';
import {
  Bell,
  Search,
  Moon,
  Sun,
  PlusCircle,
  AlertTriangle,
  ShieldCheck,
  Volume2,
  VolumeX,
  UserCheck,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User, Product, Order } from '../types';
import { formatRupiah } from '../utils/formatters';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  products: Product[];
  orders: Order[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenNewOrder: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProductForRestock: (product: Product) => void;
  onSelectOrder: (order: Order) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSwitchUser,
  products,
  orders,
  darkMode,
  onToggleDarkMode,
  soundEnabled,
  onToggleSound,
  onOpenNewOrder,
  searchQuery,
  onSearchChange,
  onSelectProductForRestock,
  onSelectOrder
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showStockAlerts, setShowStockAlerts] = useState(false);
  const [showOrderNotifs, setShowOrderNotifs] = useState(false);

  // Low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStockThreshold);

  // Recent pending or unverified orders
  const pendingOrders = orders.filter(
    o => o.orderStatus === 'pending_confirmation' || o.paymentStatus === 'unpaid'
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Owner (Admin Utama)</span>;
      case 'manager':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Manajer Operasional</span>;
      case 'cashier':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Kasir / Front-Desk</span>;
      case 'warehouse':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">Staf Gudang & PO</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Branding & Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-xl tracking-tight">
              PO
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-base leading-tight">PreeOrderin</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">PRO</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Smart Merchant & Pre-Order POS</p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative max-w-xs md:max-w-md w-full ml-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pesanan, pelanggan, produk atau batch PO..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition"
            />
          </div>
        </div>

        {/* Right Action Icons & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Audio Chime Notification Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Notifikasi Suara: Aktif' : 'Notifikasi Suara: Hening'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Low Stock Alert Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStockAlerts(!showStockAlerts);
                setShowOrderNotifs(false);
                setShowUserMenu(false);
              }}
              title="Peringatan Stok Menipis"
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <AlertTriangle className={`w-5 h-5 ${lowStockProducts.length > 0 ? 'text-amber-500 dark:text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              {lowStockProducts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            {showStockAlerts && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">Peringatan Stok Menipis ({lowStockProducts.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Ambang Batas Siaga</span>
                </div>

                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Semua stok dan kuota batch dalam kondisi aman! 👍</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {lowStockProducts.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400">
                            Sisa: <strong className="font-bold">{p.stock}</strong> (Batas min: {p.minStockThreshold}) • {p.type === 'preorder' ? 'Kuota PO' : 'Stok Ready'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            onSelectProductForRestock(p);
                            setShowStockAlerts(false);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white transition shrink-0"
                        >
                          Restok
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Order Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOrderNotifs(!showOrderNotifs);
                setShowStockAlerts(false);
                setShowUserMenu(false);
              }}
              title="Notifikasi Transaksi Real-Time"
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Bell className="w-5 h-5" />
              {pendingOrders.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center animate-bounce">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            {showOrderNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">Pesanan Perlu Tindakan ({pendingOrders.length})</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Real-Time</span>
                </div>

                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Tidak ada pesanan tertunda saat ini. Semuanya telah diproses! 🎉</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingOrders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => {
                          onSelectOrder(o);
                          setShowOrderNotifs(false);
                        }}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700/60 cursor-pointer transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{o.id}</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(o.totalAmount)}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">{o.customerName} • {o.items.length} item</p>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                          <span className="capitalize">{o.paymentMethod.replace('_', ' ')} (Kode: +{o.uniqueCode})</span>
                          <span className="text-amber-500 font-medium">{o.paymentStatus === 'unpaid' ? 'Belum Bayar' : 'Perlu Konfirmasi'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* New Order POS / PO Button */}
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">+ Pesanan Baru</span>
            <span className="sm:hidden">Order</span>
          </button>

          {/* User Profile & RBAC Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowStockAlerts(false);
                setShowOrderNotifs(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200/60 dark:border-slate-700/60"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.is2FAEnabled && (
                    <span title="2FA Aktif">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                  )}
                </p>
                <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400">Masuk sebagai:</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {getRoleBadge(currentUser.role)}
                    {currentUser.is2FAEnabled ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> 2FA Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">2FA Nonaktif</span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ganti Peran / Staf (RBAC):</p>
                  <div className="space-y-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 text-xs transition ${
                          u.id === currentUser.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                        <div className="flex-1 truncate">
                          <p className="truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                        </div>
                        {u.id === currentUser.id && <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
