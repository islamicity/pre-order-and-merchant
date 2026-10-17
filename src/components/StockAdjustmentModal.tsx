import React, { useState } from 'react';
import { X, PackagePlus, PackageMinus, Check, AlertCircle } from 'lucide-react';
import { Product, User } from '../types';

interface StockAdjustmentModalProps {
  product: Product | null;
  currentUser: User;
  onClose: () => void;
  onSaveAdjustment: (productId: string, amount: number, type: 'in' | 'out' | 'adjustment', note: string) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  currentUser,
  onClose,
  onSaveAdjustment,
}) => {
  if (!product) return null;

  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(10);
  const [note, setNote] = useState('');

  const calculateNewStock = () => {
    if (adjustmentType === 'in') return product.stock + quantity;
    if (adjustmentType === 'out') return Math.max(0, product.stock - quantity);
    return Math.max(0, quantity); // direct adjustment
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 && adjustmentType !== 'adjustment') {
      alert('Jumlah unit harus lebih besar dari 0');
      return;
    }
    onSaveAdjustment(product.id, quantity, adjustmentType, note || `Penyesuaian stok oleh ${currentUser.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Penyesuaian Stok / Restok Barang</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400">Stok / Kuota Saat Ini:</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">{product.stock} unit</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Estimasi Stok Baru:</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{calculateNewStock()} unit</p>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Jenis Perubahan Mutasi</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAdjustmentType('in')}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition ${
                  adjustmentType === 'in'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                + Masuk (Restok)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('out')}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition ${
                  adjustmentType === 'out'
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                - Keluar (Rusak)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('adjustment')}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition ${
                  adjustmentType === 'adjustment'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                = Opname Nilai
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              {adjustmentType === 'adjustment' ? 'Set Nilai Stok Akhir' : 'Jumlah Perubahan (Unit)'}
            </label>
            <input
              type="number"
              min={1}
              required
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full mt-1.5 px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Catatan / Referensi Mutasi</label>
            <input
              type="text"
              placeholder="Contoh: Penerimaan dari supplier / hasil baking batch pagi"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Mutasi Stok Otomatis</span>
          </button>

        </form>

      </div>
    </div>
  );
};
