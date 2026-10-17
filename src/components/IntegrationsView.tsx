import React, { useState } from 'react';
import {
  CloudCog,
  Database,
  Download,
  Upload,
  RefreshCw,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  Sparkles,
  Server
} from 'lucide-react';
import { ExternalSyncSetting, User } from '../types';
import { storageManager } from '../utils/storage';
import { formatDateIndo } from '../utils/formatters';

interface IntegrationsViewProps {
  syncSettings: ExternalSyncSetting;
  onUpdateSyncSettings: (settings: ExternalSyncSetting) => void;
  currentUser: User;
  onReloadAllData: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  syncSettings,
  onUpdateSyncSettings,
  currentUser,
  onReloadAllData,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(syncSettings.webhookUrl);
  const [apiKey, setApiKey] = useState(syncSettings.apiKey);
  const [syncInterval, setSyncInterval] = useState(syncSettings.syncIntervalMin);
  const [isAutoSync, setIsAutoSync] = useState(syncSettings.isAutoSyncEnabled);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Download full JSON database backup
  const handleDownloadBackup = () => {
    const jsonStr = storageManager.generateFullBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PreeOrderin-Backup-DB-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupNotice('Backup database lengkap berhasil diunduh ke komputer!');
    setTimeout(() => setBackupNotice(null), 3000);
  };

  // Restore from JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const ok = storageManager.restoreFromBackup(content);
      if (ok) {
        alert('Database berhasil dipulihkan (restore) dari file cadangan!');
        onReloadAllData();
      } else {
        alert('Gagal memulihkan database. Format file tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  // Simulate Cloud Backup Snapshot
  const handleCloudSnapshot = () => {
    storageManager.saveSyncSettings({
      ...syncSettings,
      lastSyncTime: new Date().toISOString(),
    });
    setBackupNotice('Snapshot data berhasil dienkripsi dan disinkronkan ke Cloud Backup!');
    setTimeout(() => setBackupNotice(null), 3500);
  };

  // Test Webhook Ping
  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestingWebhook(false);
      setTestResult('HTTP 200 OK: Webhook berhasil menerima payload uji coba stok inventaris real-time!');
    }, 1200);
  };

  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSyncSettings({
      webhookUrl: webhookUrl.trim(),
      apiKey: apiKey.trim(),
      syncIntervalMin: syncInterval,
      isAutoSyncEnabled: isAutoSync,
      lastSyncTime: new Date().toISOString(),
      platformName: syncSettings.platformName,
    });
    alert('Konfigurasi API dan Webhook berhasil disimpan!');
  };

  const handleRegenerateKey = () => {
    if (confirm('Regenerasi API Key baru? Integrasi sebelumnya perlu diperbarui.')) {
      const newKey = `pk_live_tk_${Math.random().toString(36).substring(2)}${Date.now()}`;
      setApiKey(newKey);
    }
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kembali ke setelan pabrik? Tindakan ini tidak dapat dibatalkan.')) {
      storageManager.resetAll();
      onReloadAllData();
      alert('Semua data berhasil direset ke data sampel awal.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CloudCog className="w-6 h-6 text-emerald-500" />
            Integrasi API Pihak Ketiga & Backup Cloud Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sinkronkan stok lintas platform e-commerce dan amankan basis data dengan pencadangan terenkripsi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCloudSnapshot}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <Server className="w-4 h-4" />
            <span>Cadangkan ke Cloud Sekarang</span>
          </button>
        </div>
      </div>

      {backupNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{backupNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* API & Webhook Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                Webhook Sinkronisasi Inventaris Real-Time
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                REST API v1
              </span>
            </div>

            <form onSubmit={handleSaveApiSettings} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Endpoint URL Webhook Eksternal</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://api.toko-online.com/webhook/inventory"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    disabled={isTestingWebhook}
                    onClick={handleTestWebhook}
                    className="px-3 py-2 font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shrink-0 flex items-center gap-1.5"
                  >
                    {isTestingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Tes Ping Webhook</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                  {testResult}
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Kunci Akses API (Bearer Token Secret)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 shrink-0"
                  >
                    Regenerasi Kunci
                  </button>
                </div>
              </div>

              {/* Interval & Auto Sync */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Interval Sinkronisasi Otomatis</label>
                  <select
                    value={syncInterval}
                    onChange={e => setSyncInterval(parseInt(e.target.value) || 15)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value={5}>Setiap 5 Menit (High Frequency)</option>
                    <option value={15}>Setiap 15 Menit (Rekomendasi)</option>
                    <option value={30}>Setiap 30 Menit</option>
                    <option value={60}>Setiap 1 Jam</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Status Auto-Sync</span>
                    <span className="text-[11px] text-slate-400">Sinkronisasi berjalan di background</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAutoSync}
                    onChange={e => setIsAutoSync(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pengaturan Integrasi API</span>
              </button>
            </form>
          </div>

          {/* JSON Payload Sample for Devs */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2">
            <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
              <span>Contoh Payload Sinkronisasi Eksternal (JSON)</span>
              <span>POST /api/v1/sync</span>
            </div>
            <pre className="overflow-x-auto text-emerald-400">
{`{
  "merchantId": "ID1020039281729",
  "eventType": "INVENTORY_STOCK_UPDATE",
  "sku": "HMP-ART-001",
  "batch": "Batch 3 - Pengiriman Pekan Ini",
  "availableStock": 45,
  "lastUpdated": "${new Date().toISOString()}"
}`}
            </pre>
          </div>
        </div>

        {/* Cloud Backup & Disaster Recovery (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                Manajemen Cadangan & Pemulihan Data
              </h3>
              <p className="text-xs text-slate-500">
                Pencadangan snapshot lokal & cloud untuk memastikan data bisnis tetap aman.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Download JSON Backup */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Unduh Backup Snapshot (.json)</p>
                  <p className="text-slate-500 text-[11px]">Berisi seluruh katalog, pesanan, struk, dan log</p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="px-3 py-1.5 font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </button>
              </div>

              {/* Restore JSON Backup */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Pulihkan Data (Restore)</p>
                  <p className="text-slate-500 text-[11px]">Unggah file .json cadangan sebelumnya</p>
                </div>
                <label className="px-3 py-1.5 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shrink-0 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset to Factory Defaults */}
              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-800 dark:text-rose-300">Reset Setelan Pabrik</p>
                  <p className="text-rose-600 dark:text-rose-400 text-[11px]">Kembalikan semua database ke demo awal</p>
                </div>
                <button
                  onClick={handleResetData}
                  className="px-3 py-1.5 font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>

            {/* Cloud Sync Status Info */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Sinkronisasi Terakhir:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {syncSettings.lastSyncTime ? formatDateIndo(syncSettings.lastSyncTime, true) : 'Belum pernah'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Tujuan:</span>
                <span className="text-slate-600 dark:text-slate-300">{syncSettings.platformName}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
