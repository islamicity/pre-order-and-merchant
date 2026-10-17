import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  QrCode,
  Tag,
  ShieldCheck,
  FileSpreadsheet,
  CloudCog,
  ChevronRight
} from 'lucide-react';
import { Role } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'preorders'
  | 'inventory'
  | 'qris_merchant'
  | 'promotions'
  | 'staff_security'
  | 'reports_export'
  | 'integrations';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  userRole: Role;
  lowStockCount: number;
  pendingOrdersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  lowStockCount,
  pendingOrdersCount,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dasbor Analitik',
      sublabel: 'Performa & Tren Penjualan',
      icon: LayoutDashboard,
      allowedRoles: ['owner', 'manager', 'cashier', 'warehouse'],
    },
    {
      id: 'preorders' as ActiveTab,
      label: 'Sistem Pre-Order',
      sublabel: 'Manajemen Pesanan & Batch PO',
      icon: ShoppingBag,
      allowedRoles: ['owner', 'manager', 'cashier', 'warehouse'],
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Stok & Inventaris',
      sublabel: 'Laporan Stok Otomatis',
      icon: PackageCheck,
      allowedRoles: ['owner', 'manager', 'warehouse'],
      badge: lowStockCount > 0 ? `${lowStockCount} Menipis` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'qris_merchant' as ActiveTab,
      label: 'QRIS & Kasir Digital',
      sublabel: 'Merchant Pribadi & Slip Bayar',
      icon: QrCode,
      allowedRoles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'promotions' as ActiveTab,
      label: 'Diskon & Pelanggan',
      sublabel: 'Kupon PO & Loyalitas',
      icon: Tag,
      allowedRoles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'staff_security' as ActiveTab,
      label: 'Staf & Keamanan',
      sublabel: 'RBAC, 2FA & Audit Log',
      icon: ShieldCheck,
      allowedRoles: ['owner', 'manager'],
    },
    {
      id: 'reports_export' as ActiveTab,
      label: 'Laporan & Ekspor',
      sublabel: 'PDF, Excel & Google Sheets',
      icon: FileSpreadsheet,
      allowedRoles: ['owner', 'manager'],
    },
    {
      id: 'integrations' as ActiveTab,
      label: 'API & Backup Cloud',
      sublabel: 'Sinkronisasi & Cadangan Data',
      icon: CloudCog,
      allowedRoles: ['owner'],
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 transition-colors">
      <div className="mb-4 hidden md:block">
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Toko Online & POS
          </p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            Taman Kuliner Islamicity
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">PO Batch 3 Aktif</span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
        {menuItems.map(item => {
          const isAllowed = item.allowedRoles.includes(userRole);
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (!isAllowed) {
            return null; // RBAC hides unauthorized menus
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <div className="hidden md:block truncate">
                  <p className="text-xs font-medium truncate">{item.label}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.sublabel}
                  </p>
                </div>
                <span className="md:hidden text-xs whitespace-nowrap font-medium">{item.label}</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5">
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-200" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick Mobile Tip */}
      <div className="hidden md:block mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-600 dark:text-slate-300">Pusat Otorisasi Kasir</p>
        <p className="mt-1">Peran aktif menentukan pembatasan akses hak operasional.</p>
      </div>
    </aside>
  );
};
