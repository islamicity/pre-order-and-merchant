import React, { useState } from 'react';
import {
  PackageCheck,
  AlertTriangle,
  PlusCircle,
  Search,
  ArrowUpDown,
  History,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Product, StockMovementLog, User } from '../types';
import { formatRupiah, formatDateIndo, formatNumber } from '../utils/formatters';
import { exportInventoryToCsv, exportStockLogsToCsv } from '../utils/exportUtils';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface InventoryViewProps {
  products: Product[];
  stockLogs: StockMovementLog[];
  currentUser: User;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onStockAdjustment: (productId: string, amount: number, type: 'in' | 'out' | 'adjustment', note: string) => void;
  searchQuery: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockLogs,
  currentUser,
  onUpdateProduct,
  onAddProduct,
  onStockAdjustment,
  searchQuery,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'preorder' | 'ready'>('all');
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState('Kuliner & Catering');
  const [newType, setNewType] = useState<'preorder' | 'ready'>('preorder');
  const [newPrice, setNewPrice] = useState(150000);
  const [newCostPrice, setNewCostPrice] = useState(85000);
  const [newStock, setNewStock] = useState(25);
  const [newMinThreshold, setNewMinThreshold] = useState(5);
  const [newBatchName, setNewBatchName] = useState('Batch 1');
  const [newEstimatedDate, setNewEstimatedDate] = useState('2026-10-25');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80');

  // Categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Low stock items
  const lowStockProducts = products.filter(p => p.stock <= p.minStockThreshold);

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCat) return false;
    }
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim()) {
      alert('Nama produk dan SKU wajib diisi');
      return;
    }

    const created: Product = {
      id: `prod-${Date.now()}`,
      name: newName.trim(),
      sku: newSku.trim().toUpperCase(),
      category: newCategory,
      type: newType,
      price: newPrice,
      costPrice: newCostPrice,
      minDpPercent: newType === 'preorder' ? 50 : 0,
      stock: newStock,
      minStockThreshold: newMinThreshold,
      totalOrdered: 0,
      totalFulfilled: 0,
      batchName: newType === 'preorder' ? newBatchName : undefined,
      estimatedFulfillmentDate: newType === 'preorder' ? newEstimatedDate : undefined,
      description: newDescription,
      imageUrl: newImageUrl,
      variants: [],
      isActive: true,
    };

    onAddProduct(created);
    setShowAddProductModal(false);
    // Reset form
    setNewName('');
    setNewSku('');
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-500" />
            Integrasi Laporan Stok & Inventaris Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Pantau ketersediaan bahan, kuota batch PO, ambang batas stok menipis, dan log audit mutasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'catalog' ? (
            <button
              onClick={() => exportInventoryToCsv(products)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Stok (.csv)</span>
            </button>
          ) : (
            <button
              onClick={() => exportStockLogsToCsv(stockLogs)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Mutasi (.csv)</span>
            </button>
          )}

          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Produk / Batch</span>
          </button>
        </div>
      </div>

      {/* Low Stock Real-Time Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Peringatan Stok Menipis: {lowStockProducts.length} Produk Mencapai Ambang Batas Kritis!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Segera lakukan pengadaan atau restok kuota batch agar pesanan PO tidak terhambat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {lowStockProducts.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProductForAdjust(p)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition flex items-center gap-1"
              >
                <span>Restok {p.sku} ({p.stock})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Switcher: Catalog vs Mutasi Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'catalog' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Katalog Stok & Kuota PO ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          Riwayat Mutasi & Audit Stok ({stockLogs.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filters */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${typeFilter === 'all' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
              >
                Semua Tipe
              </button>
              <button
                onClick={() => setTypeFilter('preorder')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${typeFilter === 'preorder' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
              >
                Pre-Order (PO)
              </button>
              <button
                onClick={() => setTypeFilter('ready')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${typeFilter === 'ready' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
              >
                Ready Stock
              </button>
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(p => {
              const isLow = p.stock <= p.minStockThreshold;
              const margin = p.price - p.costPrice;
              const marginPercent = Math.round((margin / p.price) * 100);

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition hover:shadow-md flex flex-col justify-between ${
                    isLow ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/30' : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${
                          p.type === 'preorder' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {p.type === 'preorder' ? 'Pre-Order' : 'Ready Stock'}
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-sm animate-pulse">
                            Stok Menipis
                          </span>
                        )}
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white backdrop-blur-sm">
                        {p.sku}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium">{p.category}</p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {p.description}
                    </p>

                    {/* PO Batch Details if preorder */}
                    {p.type === 'preorder' && p.batchName && (
                      <div className="mt-2.5 p-2 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-300">
                        <p className="font-bold">{p.batchName}</p>
                        <p className="text-slate-500">Estimasi Kirim: {p.estimatedFulfillmentDate ? formatDateIndo(p.estimatedFulfillmentDate) : '-'}</p>
                      </div>
                    )}

                    {/* Price & Margin */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Harga Jual:</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{formatRupiah(p.price)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">HPP / Margin:</span>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(margin)} ({marginPercent}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level & Adjust Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">
                        {p.type === 'preorder' ? 'Sisa Kuota PO:' : 'Stok Fisik:'}
                      </span>
                      <p className={`text-base font-black ${isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                        {p.stock} <span className="text-xs font-normal text-slate-400">/ min {p.minStockThreshold}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedProductForAdjust(p)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        isLow
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      Penyesuaian Stok
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Stock Movement Log Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-500" />
              Log Audit Mutasi Stok Real-Time
            </h3>
            <span className="text-xs text-slate-400">Terekam otomatis oleh sistem</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Produk</th>
                  <th className="py-2.5 px-4">Jenis Mutasi</th>
                  <th className="py-2.5 px-4 text-center">Perubahan</th>
                  <th className="py-2.5 px-4 text-center">Sebelum &rarr; Sesudah</th>
                  <th className="py-2.5 px-4">Keterangan</th>
                  <th className="py-2.5 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-slate-500">{formatDateIndo(log.timestamp, true)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{log.productName}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.type === 'in' ? 'bg-emerald-100 text-emerald-700' :
                        log.type === 'out' ? 'bg-rose-100 text-rose-700' :
                        log.type === 'po_reservation' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.type === 'in' ? 'Stok Masuk' :
                         log.type === 'out' ? 'Stok Keluar' :
                         log.type === 'po_reservation' ? 'Reservasi PO' : 'Opname / Edit'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 text-center font-bold font-mono ${log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                      {log.previousStock} &rarr; {log.newStock}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{log.note}</td>
                    <td className="py-2.5 px-4 text-slate-500">{log.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProductForAdjust && (
        <StockAdjustmentModal
          product={selectedProductForAdjust}
          currentUser={currentUser}
          onClose={() => setSelectedProductForAdjust(null)}
          onSaveAdjustment={onStockAdjustment}
        />
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Produk / Batch Pre-Order Baru</h3>
              <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hampers Nastar Wisman"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kode SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: HMP-NST-001"
                    value={newSku}
                    onChange={e => setNewSku(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Kuliner & Catering">Kuliner & Catering</option>
                    <option value="Hampers & Gift">Hampers & Gift</option>
                    <option value="Kue & Roti">Kue & Roti</option>
                    <option value="Kopi & Minuman">Kopi & Minuman</option>
                    <option value="Fashion & Kriya">Fashion & Kriya</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Model Penjualan</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="preorder">Pre-Order (PO)</option>
                    <option value="ready">Ready Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">HPP / Biaya Pokok (Rp)</label>
                  <input
                    type="number"
                    value={newCostPrice}
                    onChange={e => setNewCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    {newType === 'preorder' ? 'Kuota PO Awal (Pcs)' : 'Stok Awal (Pcs)'}
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Ambang Batas Siaga (Min Stok)</label>
                  <input
                    type="number"
                    value={newMinThreshold}
                    onChange={e => setNewMinThreshold(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {newType === 'preorder' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200">
                  <div>
                    <label className="font-semibold text-purple-900 dark:text-purple-300">Nama Batch PO</label>
                    <input
                      type="text"
                      value={newBatchName}
                      onChange={e => setNewBatchName(e.target.value)}
                      placeholder="Contoh: Batch Weekend Ceria"
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-purple-900 dark:text-purple-300">Estimasi Selesai / Kirim</label>
                    <input
                      type="date"
                      value={newEstimatedDate}
                      onChange={e => setNewEstimatedDate(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Detail isi paket, bahan, instruksi penyimpanan..."
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Produk ke Sistem</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
