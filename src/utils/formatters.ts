export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDateIndo(dateStr: string, withTime = false): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  if (withTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  }

  return `${day} ${month} ${year}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function generateOrderId(prefix = 'PO'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}${month}${day}-${random}`;
}

export function generateUniquePaymentCode(): number {
  // Generates 3-digit verification code e.g. 101 - 899
  return Math.floor(100 + Math.random() * 800);
}

export function getWhatsAppUrl(phone: string, message: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function generateQrisString(config: {
  nmid: string;
  merchantName: string;
  city: string;
  amount?: number;
  orderId?: string;
}): string {
  // EMVCo QRIS specification:
  // Tag 01: 010211 (Static) or 010212 (Dynamic with fixed amount)
  const isDynamic = !!config.amount && config.amount > 0;
  const initiationMethod = isDynamic ? '010212' : '010211';
  
  const amountStr = isDynamic ? `54${String(config.amount!.toString().length).padStart(2, '0')}${config.amount}` : '';
  const merchantName = (config.merchantName || 'MERCHANT QRIS').slice(0, 25).toUpperCase();
  const city = (config.city || 'JAKARTA').slice(0, 15).toUpperCase();
  
  // Tag 62: Additional Data Template for Invoice / Order Reference
  let additionalData = '';
  if (config.orderId) {
    const refValue = config.orderId.slice(0, 25);
    const subTag01 = `01${String(refValue.length).padStart(2, '0')}${refValue}`;
    additionalData = `62${String(subTag01.length).padStart(2, '0')}${subTag01}`;
  }
  
  return `000201${initiationMethod}26600014ID.LINKAJA.WWW01189360091100223940300215${config.nmid || 'ID1020039281729'}520458125303360${amountStr}5802ID59${String(merchantName.length).padStart(2, '0')}${merchantName}60${String(city.length).padStart(2, '0')}${city}${additionalData}6304`;
}
