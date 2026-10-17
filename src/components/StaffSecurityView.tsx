import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Lock,
  History,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { User, AuditLog, Role } from '../types';
import { formatDateIndo } from '../utils/formatters';
import { TwoFactorAuthModal } from './TwoFactorAuthModal';

interface StaffSecurityViewProps {
  users: User[];
  currentUser: User;
  auditLogs: AuditLog[];
  onToggle2FA: (userId: string, enable: boolean) => void;
  onUpdateUserRole: (userId: string, newRole: Role) => void;
}

export const StaffSecurityView: React.FC<StaffSecurityViewProps> = ({
  users,
  currentUser,
  auditLogs,
  onToggle2FA,
  onUpdateUserRole,
}) => {
  const [selectedUserFor2FA, setSelectedUserFor2FA] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'staff' | 'matrix' | 'logs'>('staff');
  const [logSearch, setLogSearch] = useState('');

  const permissionsMatrix = [
    { feature: 'Buat & Edit Pesanan PO / Kasir POS', owner: true, manager: true, cashier: true, warehouse: false },
    { feature: 'Verifikasi Slip Bayar QRIS & Bank', owner: true, manager: true, cashier: true, warehouse: false },
    { feature: 'Penyesuaian Stok Barang & Bahan', owner: true, manager: true, cashier: false, warehouse: true },
    { feature: 'Kelola Katalog Produk & Batch PO', owner: true, manager: true, cashier: false, warehouse: false },
    { feature: 'Manajemen Kupon Diskon & Promo', owner: true, manager: true, cashier: false, warehouse: false },
    { feature: 'Ekspor Laporan Keuangan (PDF/Excel)', owner: true, manager: true, cashier: false, warehouse: false },
    { feature: 'Kelola Akun Staf & Role RBAC', owner: true, manager: false, cashier: false, warehouse: false },
    { feature: 'Backup Cloud & Sinkronisasi API', owner: true, manager: false, cashier: false, warehouse: false },
  ];

  const filteredLogs = auditLogs.filter(log => {
    if (!logSearch) return true;
    const q = logSearch.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.ipAddress.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Akses Multi-Pengguna, RBAC & Keamanan Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kelola izin hak akses karyawan, autentikasi dua faktor (2FA), dan pantau riwayat audit log aktivitas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Enkripsi Data Sistem Aktif</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'staff' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Daftar Staf & Akun Pengguna ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'matrix' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Matriks Hak Akses (RBAC)
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Log Audit Keamanan ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'staff' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{u.name}</h3>
                      {u.is2FAEnabled && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 2FA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    <p className="text-xs font-mono text-slate-400">{u.phone}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Peran Otorisasi:</span>
                    <select
                      value={u.role}
                      disabled={currentUser.role !== 'owner'}
                      onChange={e => onUpdateUserRole(u.id, e.target.value as Role)}
                      className="block mt-0.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold capitalize outline-none"
                    >
                      <option value="owner">Owner (Admin Utama)</option>
                      <option value="manager">Manajer Operasional</option>
                      <option value="cashier">Kasir / Front-Desk</option>
                      <option value="warehouse">Staf Gudang & PO</option>
                    </select>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Login Terakhir:</span>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {formatDateIndo(u.lastLogin, true)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">PIN Kasir: ••••{u.pinCode.slice(-2)}</span>
                <button
                  onClick={() => setSelectedUserFor2FA(u)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{u.is2FAEnabled ? 'Kelola 2FA' : 'Aktifkan 2FA'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'matrix' ? (
        /* RBAC Matrix Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Matriks Hak Akses Peran Karyawan (RBAC)</h3>
            <p className="text-xs text-slate-500">Mencegah penyalahgunaan wewenang kasir dan menjaga integritas laporan keuangan.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Fitur / Modul Operasional</th>
                  <th className="py-3 px-4 text-center">Owner (Admin)</th>
                  <th className="py-3 px-4 text-center">Manajer</th>
                  <th className="py-3 px-4 text-center">Kasir Toko</th>
                  <th className="py-3 px-4 text-center">Staf Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissionsMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {item.owner ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.manager ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.cashier ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.warehouse ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Logs Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-500" />
                Catatan Jejak Audit Keamanan Sistem (Immutable)
              </h3>
              <p className="text-xs text-slate-500">Merekam login, 2FA, transaksi kasir, dan pengubahan inventaris</p>
            </div>

            <input
              type="text"
              placeholder="Filter riwayat audit..."
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Pengguna & Peran</th>
                  <th className="py-3 px-4">Aksi / Event</th>
                  <th className="py-3 px-4">Rincian Aktivitas</th>
                  <th className="py-3 px-4 font-mono">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-500">{formatDateIndo(log.timestamp, true)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{log.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {selectedUserFor2FA && (
        <TwoFactorAuthModal
          user={selectedUserFor2FA}
          isOpen={!!selectedUserFor2FA}
          onClose={() => setSelectedUserFor2FA(null)}
          onToggle2FA={onToggle2FA}
        />
      )}

    </div>
  );
};
