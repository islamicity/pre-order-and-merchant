export type Role = 'owner' | 'manager' | 'cashier' | 'warehouse';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone: string;
  is2FAEnabled: boolean;
  secret2FA?: string;
  pinCode: string;
  lastLogin: string;
}

export type ProductType = 'preorder' | 'ready';

export interface ProductVariant {
  id: string;
  name: string;
  additionalPrice: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: ProductType;
  price: number;
  costPrice: number; // HPP (Harga Pokok Penjualan)
  minDpPercent: number; // e.g. 50 for 50%
  stock: number; // Kuota untuk PO atau real stok untuk ready
  minStockThreshold: number; // Alert stok menipis
  totalOrdered: number;
  totalFulfilled: number;
  batchName?: string;
  batchStartDate?: string;
  batchEndDate?: string;
  estimatedFulfillmentDate?: string;
  description: string;
  imageUrl: string;
  variants: ProductVariant[];
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  costPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'qris' | 'bank_transfer' | 'ewallet' | 'cash';
export type PaymentStatus = 'unpaid' | 'dp_verified' | 'paid_full' | 'refunded';
export type OrderStatus = 'draft' | 'pending_confirmation' | 'in_production' | 'ready_for_dispatch' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: 'pickup' | 'delivery';
  shippingAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  uniqueCode: number; // 3 digit unik untuk QRIS (misal +125)
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cashierStaffName: string;
  estimatedReadyDate: string;
}

export interface QrisMerchantConfig {
  merchantName: string;
  nmid: string;
  city: string;
  postalCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  rawQrisPayload: string;
  useUniqueCode: boolean;
  autoVerificationDelaySec: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number; // 10 for 10% or 15000 for Rp 15.000
  minSpend: number;
  maxDiscount?: number;
  quota: number;
  usedCount: number;
  validUntil: string;
  isEarlyBirdPo: boolean;
  isActive: boolean;
}

export interface CustomerLoyalty {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  totalOrders: number;
  totalSpend: number;
  joinedDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  details: string;
  ipAddress: string;
}

export interface StockMovementLog {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  type: 'in' | 'out' | 'po_reservation' | 'adjustment';
  note: string;
  performedBy: string;
}

export interface ExternalSyncSetting {
  webhookUrl: string;
  apiKey: string;
  syncIntervalMin: number;
  lastSyncTime?: string;
  isAutoSyncEnabled: boolean;
  platformName: string;
}
