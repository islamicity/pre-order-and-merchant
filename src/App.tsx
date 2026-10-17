import React, { useState, useEffect } from 'react';
import {
  Product,
  Order,
  User,
  Coupon,
  CustomerLoyalty,
  QrisMerchantConfig,
  AuditLog,
  StockMovementLog,
  ExternalSyncSetting,
  OrderStatus,
  PaymentStatus,
  Role
} from './types';
import { storageManager } from './utils/storage';
import { soundManager } from './utils/audioNotification';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PreOrderView } from './components/PreOrderView';
import { InventoryView } from './components/InventoryView';
import { QrisPaymentView } from './components/QrisPaymentView';
import { PromotionsView } from './components/PromotionsView';
import { StaffSecurityView } from './components/StaffSecurityView';
import { ReportsExportView } from './components/ReportsExportView';
import { IntegrationsView } from './components/IntegrationsView';
import { NewOrderModal } from './components/NewOrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';

export default function App() {
  // Load state from local storage or initial seed data
  const [currentUser, setCurrentUser] = useState<User>(() => storageManager.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => storageManager.getUsers());
  const [products, setProducts] = useState<Product[]>(() => storageManager.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => storageManager.getOrders());
  const [coupons, setCoupons] = useState<Coupon[]>(() => storageManager.getCoupons());
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<CustomerLoyalty[]>(() => storageManager.getLoyalty());
  const [qrisConfig, setQrisConfig] = useState<QrisMerchantConfig>(() => storageManager.getQrisConfig());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageManager.getAuditLogs());
  const [stockLogs, setStockLogs] = useState<StockMovementLog[]>(() => storageManager.getStockLogs());
  const [syncSettings, setSyncSettings] = useState<ExternalSyncSetting>(() => storageManager.getSyncSettings());
  
  // UI & Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => storageManager.getDarkMode());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const [targetQrisOrder, setTargetQrisOrder] = useState<Order | null>(null);

  const handleOpenQrisForOrder = (order: Order) => {
    setTargetQrisOrder(order);
    setActiveTab('qris_merchant');
  };

  // Initialize Dark Mode class on document
  useEffect(() => {
    storageManager.setDarkMode(darkMode);
  }, [darkMode]);

  // Save changes to storage whenever state updates
  const reloadFromStorage = () => {
    setCurrentUser(storageManager.getCurrentUser());
    setUsers(storageManager.getUsers());
    setProducts(storageManager.getProducts());
    setOrders(storageManager.getOrders());
    setCoupons(storageManager.getCoupons());
    setLoyaltyCustomers(storageManager.getLoyalty());
    setQrisConfig(storageManager.getQrisConfig());
    setAuditLogs(storageManager.getAuditLogs());
    setStockLogs(storageManager.getStockLogs());
    setSyncSettings(storageManager.getSyncSettings());
  };

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    storageManager.setDarkMode(next);
  };

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    storageManager.saveCurrentUser(user);

    // Add Audit Log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'SWITCH_USER_ACCOUNT',
      details: `Beralih sesi login ke ${user.name} (${user.role.toUpperCase()})`,
      ipAddress: '180.252.164.22',
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    storageManager.saveAuditLogs(updatedLogs);
  };

  // Create new order handler
  const handleSaveOrder = (newOrder: Order) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    storageManager.saveOrders(updatedOrders);

    // Update product stock / quota & create stock movement log
    const updatedProducts = [...products];
    const newStockMovements: StockMovementLog[] = [];

    newOrder.items.forEach(item => {
      const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (prodIndex > -1) {
        const prod = updatedProducts[prodIndex];
        const prevStock = prod.stock;
        const newStock = Math.max(0, prod.stock - item.quantity);
        prod.stock = newStock;
        prod.totalOrdered += item.quantity;

        newStockMovements.push({
          id: `stk-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          changeAmount: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          type: prod.type === 'preorder' ? 'po_reservation' : 'out',
          note: `Pesanan Baru ${newOrder.id} (${newOrder.customerName})`,
          performedBy: currentUser.name,
        });

        // Trigger warning sound if product stock reached low threshold
        if (newStock <= prod.minStockThreshold && soundEnabled) {
          soundManager.playLowStockAlert();
        }
      }
    });

    setProducts(updatedProducts);
    storageManager.saveProducts(updatedProducts);

    const updatedStockLogs = [...newStockMovements, ...stockLogs];
    setStockLogs(updatedStockLogs);
    storageManager.saveStockLogs(updatedStockLogs);

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'CREATE_ORDER',
      details: `Membuat pesanan ${newOrder.id} untuk ${newOrder.customerName} senilai Rp ${newOrder.totalAmount.toLocaleString('id-ID')}`,
      ipAddress: '180.252.164.22',
    };
    const updatedAuditLogs = [log, ...auditLogs];
    setAuditLogs(updatedAuditLogs);
    storageManager.saveAuditLogs(updatedAuditLogs);
  };

  // Update order status handler
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, orderStatus: status, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    setOrders(updatedOrders);
    storageManager.saveOrders(updatedOrders);

    // Update modal reference if open
    if (selectedOrderForDetail?.id === orderId) {
      setSelectedOrderForDetail(prev => prev ? { ...prev, orderStatus: status } : null);
    }

    // Audit log
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_ORDER_STATUS',
      details: `Mengubah status pesanan ${orderId} menjadi ${status.toUpperCase()}`,
      ipAddress: '180.252.164.22',
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    storageManager.saveAuditLogs(updatedLogs);
  };

  // Update payment status handler
  const handleUpdatePaymentStatus = (orderId: string, status: PaymentStatus, proofUrl?: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        let nextOrderStatus = o.orderStatus;
        if (o.orderStatus === 'pending_confirmation') {
          nextOrderStatus = 'in_production';
        }
        return {
          ...o,
          paymentStatus: status,
          orderStatus: nextOrderStatus,
          paymentProofUrl: proofUrl || o.paymentProofUrl,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    setOrders(updatedOrders);
    storageManager.saveOrders(updatedOrders);

    if (selectedOrderForDetail?.id === orderId) {
      setSelectedOrderForDetail(prev => prev ? {
        ...prev,
        paymentStatus: status,
        paymentProofUrl: proofUrl || prev.paymentProofUrl
      } : null);
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'VERIFY_PAYMENT',
      details: `Verifikasi pembayaran pesanan ${orderId}: ${status.toUpperCase()}`,
      ipAddress: '180.252.164.22',
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    storageManager.saveAuditLogs(updatedLogs);
  };

  // Stock Adjustment Handler
  const handleStockAdjustment = (productId: string, amount: number, type: 'in' | 'out' | 'adjustment', note: string) => {
    const prodIndex = products.findIndex(p => p.id === productId);
    if (prodIndex === -1) return;

    const prod = products[prodIndex];
    const prevStock = prod.stock;
    let newStock = prevStock;

    if (type === 'in') newStock = prevStock + amount;
    else if (type === 'out') newStock = Math.max(0, prevStock - amount);
    else if (type === 'adjustment') newStock = Math.max(0, amount);

    const changeAmount = newStock - prevStock;
    const updatedProd = { ...prod, stock: newStock };
    const updatedProducts = [...products];
    updatedProducts[prodIndex] = updatedProd;

    setProducts(updatedProducts);
    storageManager.saveProducts(updatedProducts);

    const movement: StockMovementLog = {
      id: `stk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: prod.id,
      productName: prod.name,
      changeAmount,
      previousStock: prevStock,
      newStock,
      type,
      note,
      performedBy: currentUser.name,
    };

    const updatedStockLogs = [movement, ...stockLogs];
    setStockLogs(updatedStockLogs);
    storageManager.saveStockLogs(updatedStockLogs);

    if (newStock <= prod.minStockThreshold && soundEnabled) {
      soundManager.playLowStockAlert();
    }
  };

  // Add Product Handler
  const handleAddProduct = (newProd: Product) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    storageManager.saveProducts(updated);

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: 'ADD_PRODUCT',
      details: `Menambahkan produk baru ${newProd.name} (${newProd.sku})`,
      ipAddress: '180.252.164.22',
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    storageManager.saveAuditLogs(updatedLogs);
  };

  const handleUpdateProduct = (updated: Product) => {
    const newProducts = products.map(p => p.id === updated.id ? updated : p);
    setProducts(newProducts);
    storageManager.saveProducts(newProducts);
  };

  // QRIS Config Handler
  const handleUpdateQrisConfig = (newConfig: QrisMerchantConfig) => {
    setQrisConfig(newConfig);
    storageManager.saveQrisConfig(newConfig);
  };

  // Coupon Handlers
  const handleAddCoupon = (coupon: Coupon) => {
    const updated = [coupon, ...coupons];
    setCoupons(updated);
    storageManager.saveCoupons(updated);
  };

  const handleToggleCoupon = (couponId: string) => {
    const updated = coupons.map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
    setCoupons(updated);
    storageManager.saveCoupons(updated);
  };

  // 2FA Handler
  const handleToggle2FA = (userId: string, enable: boolean) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, is2FAEnabled: enable } : u);
    setUsers(updatedUsers);
    storageManager.saveUsers(updatedUsers);

    if (currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, is2FAEnabled: enable };
      setCurrentUser(updatedCurrent);
      storageManager.saveCurrentUser(updatedCurrent);
    }

    const targetUser = users.find(u => u.id === userId);
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action: enable ? 'ENABLE_2FA' : 'DISABLE_2FA',
      details: `${enable ? 'Mengaktifkan' : 'Menonaktifkan'} 2FA untuk akun ${targetUser?.name}`,
      ipAddress: '180.252.164.22',
    };
    const updatedLogs = [log, ...auditLogs];
    setAuditLogs(updatedLogs);
    storageManager.saveAuditLogs(updatedLogs);
  };

  // Update Role Handler
  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);
    storageManager.saveUsers(updatedUsers);

    if (currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurrent);
      storageManager.saveCurrentUser(updatedCurrent);
    }
  };

  // Sync Settings Handler
  const handleUpdateSyncSettings = (settings: ExternalSyncSetting) => {
    setSyncSettings(settings);
    storageManager.saveSyncSettings(settings);
  };

  // Counts
  const lowStockCount = products.filter(p => p.stock <= p.minStockThreshold).length;
  const pendingOrdersCount = orders.filter(
    o => o.orderStatus === 'pending_confirmation' || o.paymentStatus === 'unpaid'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        products={products}
        orders={orders}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProductForRestock={p => {
          setActiveTab('inventory');
        }}
        onSelectOrder={order => {
          setSelectedOrderForDetail(order);
        }}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={currentUser.role}
          lowStockCount={lowStockCount}
          pendingOrdersCount={pendingOrdersCount}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              products={products}
              onNavigateToPreOrders={() => setActiveTab('preorders')}
              onNavigateToInventory={() => setActiveTab('inventory')}
              onNavigateToQris={(order) => {
                setTargetQrisOrder(order || null);
                setActiveTab('qris_merchant');
              }}
            />
          )}

          {activeTab === 'preorders' && (
            <PreOrderView
              orders={orders}
              products={products}
              currentUser={currentUser}
              onOpenNewOrder={() => setIsNewOrderOpen(true)}
              onSelectOrder={order => setSelectedOrderForDetail(order)}
              onOpenReceipt={order => setSelectedOrderForReceipt(order)}
              onOpenQrisPayment={handleOpenQrisForOrder}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              stockLogs={stockLogs}
              currentUser={currentUser}
              onUpdateProduct={handleUpdateProduct}
              onAddProduct={handleAddProduct}
              onStockAdjustment={handleStockAdjustment}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'qris_merchant' && (
            <QrisPaymentView
              qrisConfig={qrisConfig}
              onUpdateConfig={handleUpdateQrisConfig}
              orders={orders}
              onVerifyOrderPayment={(orderId, status) => handleUpdatePaymentStatus(orderId, status || 'paid_full')}
              currentUser={currentUser}
              targetOrder={targetQrisOrder}
            />
          )}

          {activeTab === 'promotions' && (
            <PromotionsView
              coupons={coupons}
              loyaltyCustomers={loyaltyCustomers}
              currentUser={currentUser}
              onAddCoupon={handleAddCoupon}
              onToggleCoupon={handleToggleCoupon}
            />
          )}

          {activeTab === 'staff_security' && (
            <StaffSecurityView
              users={users}
              currentUser={currentUser}
              auditLogs={auditLogs}
              onToggle2FA={handleToggle2FA}
              onUpdateUserRole={handleUpdateUserRole}
            />
          )}

          {activeTab === 'reports_export' && (
            <ReportsExportView
              orders={orders}
              products={products}
              stockLogs={stockLogs}
              loyaltyCustomers={loyaltyCustomers}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView
              syncSettings={syncSettings}
              onUpdateSyncSettings={handleUpdateSyncSettings}
              currentUser={currentUser}
              onReloadAllData={reloadFromStorage}
            />
          )}
        </main>
      </div>

      {/* New Order Modal */}
      {isNewOrderOpen && (
        <NewOrderModal
          isOpen={isNewOrderOpen}
          onClose={() => setIsNewOrderOpen(false)}
          products={products}
          coupons={coupons}
          currentUser={currentUser}
          onSaveOrder={handleSaveOrder}
        />
      )}

      {/* Order Detail & Verification Modal */}
      {selectedOrderForDetail && (
        <OrderDetailModal
          order={selectedOrderForDetail}
          onClose={() => setSelectedOrderForDetail(null)}
          currentUser={currentUser}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onOpenReceipt={order => setSelectedOrderForReceipt(order)}
          onOpenQrisPayment={handleOpenQrisForOrder}
        />
      )}

      {/* Thermal & Invoice Receipt Print Modal */}
      {selectedOrderForReceipt && (
        <ReceiptPrintModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}

    </div>
  );
}
