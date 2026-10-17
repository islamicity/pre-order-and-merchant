import {
  Product,
  Order,
  User,
  Coupon,
  CustomerLoyalty,
  QrisMerchantConfig,
  AuditLog,
  StockMovementLog,
  ExternalSyncSetting
} from '../types';
import {
  initialProducts,
  initialOrders,
  initialUsers,
  initialCoupons,
  initialLoyaltyCustomers,
  initialQrisConfig,
  initialAuditLogs,
  initialStockLogs,
  initialSyncSettings
} from '../data/mockInitialData';

const STORAGE_KEYS = {
  PRODUCTS: 'preeorderin_products_v1',
  ORDERS: 'preeorderin_orders_v1',
  USERS: 'preeorderin_users_v1',
  CURRENT_USER: 'preeorderin_active_user_v1',
  COUPONS: 'preeorderin_coupons_v1',
  LOYALTY: 'preeorderin_loyalty_v1',
  QRIS_CONFIG: 'preeorderin_qris_config_v1',
  AUDIT_LOGS: 'preeorderin_audit_logs_v1',
  STOCK_LOGS: 'preeorderin_stock_logs_v1',
  SYNC_SETTINGS: 'preeorderin_sync_settings_v1',
  DARK_MODE: 'preeorderin_dark_mode_v1',
};

export const storageManager = {
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : initialProducts;
  },
  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getOrders(): Order[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : initialOrders;
  },
  saveOrders(orders: Order[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : initialUsers;
  },
  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser(): User {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        // fallback
      }
    }
    return initialUsers[0]; // Default: Owner
  },
  saveCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getCoupons(): Coupon[] {
    const data = localStorage.getItem(STORAGE_KEYS.COUPONS);
    return data ? JSON.parse(data) : initialCoupons;
  },
  saveCoupons(coupons: Coupon[]) {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  },

  getLoyalty(): CustomerLoyalty[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOYALTY);
    return data ? JSON.parse(data) : initialLoyaltyCustomers;
  },
  saveLoyalty(loyalty: CustomerLoyalty[]) {
    localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(loyalty));
  },

  getQrisConfig(): QrisMerchantConfig {
    const data = localStorage.getItem(STORAGE_KEYS.QRIS_CONFIG);
    return data ? JSON.parse(data) : initialQrisConfig;
  },
  saveQrisConfig(config: QrisMerchantConfig) {
    localStorage.setItem(STORAGE_KEYS.QRIS_CONFIG, JSON.stringify(config));
  },

  getAuditLogs(): AuditLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return data ? JSON.parse(data) : initialAuditLogs;
  },
  saveAuditLogs(logs: AuditLog[]) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 300))); // keep latest 300
  },

  getStockLogs(): StockMovementLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
    return data ? JSON.parse(data) : initialStockLogs;
  },
  saveStockLogs(logs: StockMovementLog[]) {
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(logs.slice(0, 300)));
  },

  getSyncSettings(): ExternalSyncSetting {
    const data = localStorage.getItem(STORAGE_KEYS.SYNC_SETTINGS);
    return data ? JSON.parse(data) : initialSyncSettings;
  },
  saveSyncSettings(settings: ExternalSyncSetting) {
    localStorage.setItem(STORAGE_KEYS.SYNC_SETTINGS, JSON.stringify(settings));
  },

  getDarkMode(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return val !== null ? val === 'true' : false;
  },
  setDarkMode(isDark: boolean) {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Export full JSON Backup
  generateFullBackupJson(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'PreeOrderin Smart Management',
      products: this.getProducts(),
      orders: this.getOrders(),
      users: this.getUsers(),
      coupons: this.getCoupons(),
      loyalty: this.getLoyalty(),
      qrisConfig: this.getQrisConfig(),
      auditLogs: this.getAuditLogs(),
      stockLogs: this.getStockLogs(),
      syncSettings: this.getSyncSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Restore from JSON string
  restoreFromBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) this.saveProducts(data.products);
      if (data.orders) this.saveOrders(data.orders);
      if (data.users) this.saveUsers(data.users);
      if (data.coupons) this.saveCoupons(data.coupons);
      if (data.loyalty) this.saveLoyalty(data.loyalty);
      if (data.qrisConfig) this.saveQrisConfig(data.qrisConfig);
      if (data.auditLogs) this.saveAuditLogs(data.auditLogs);
      if (data.stockLogs) this.saveStockLogs(data.stockLogs);
      if (data.syncSettings) this.saveSyncSettings(data.syncSettings);
      return true;
    } catch (err) {
      console.error('Failed to restore backup', err);
      return false;
    }
  },

  // Reset to initial mock data
  resetAll() {
    localStorage.clear();
    this.saveProducts(initialProducts);
    this.saveOrders(initialOrders);
    this.saveUsers(initialUsers);
    this.saveCurrentUser(initialUsers[0]);
    this.saveCoupons(initialCoupons);
    this.saveLoyalty(initialLoyaltyCustomers);
    this.saveQrisConfig(initialQrisConfig);
    this.saveAuditLogs(initialAuditLogs);
    this.saveStockLogs(initialStockLogs);
    this.saveSyncSettings(initialSyncSettings);
  }
};
