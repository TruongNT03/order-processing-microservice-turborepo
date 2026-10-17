/**
 * Contract (request/result) của các bước saga khi gọi sang service khác
 * qua RabbitMQ request-reply. Khai báo local để order-service không phải
 * import chéo từ thư mục dto của service khác (mỗi app là 1 package riêng).
 * Shape phải khớp 100% với handler bên product/inventory/payment-service.
 */

// --- product.check_availability ---
export interface CheckAvailabilityItem {
  productId: string;
  quantity: number;
}
export interface CheckAvailabilityRequest {
  items: CheckAvailabilityItem[];
}
export interface CheckedProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}
export interface CheckAvailabilityResult {
  available: boolean;
  reason?: string;
  items: CheckedProduct[];
  totalAmount: number;
}

// --- inventory.reserve / inventory.release ---
export interface ReserveItem {
  productId: string;
  quantity: number;
}
export interface ReserveInventoryRequest {
  orderId: string;
  items: ReserveItem[];
}
export interface ReleaseInventoryRequest {
  orderId: string;
}
export interface ReserveInventoryResult {
  success: boolean;
  orderId: string;
  reservationId?: string;
  reason?: string;
  shortages?: { productId: string; requested: number; available: number }[];
}
export interface ReleaseInventoryResult {
  success: boolean;
  orderId: string;
  released: boolean;
  reason?: string;
}

// --- payment.process / payment.refund ---
export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
}
export interface RefundPaymentRequest {
  orderId: string;
}
export interface ProcessPaymentResult {
  success: boolean;
  orderId: string;
  paymentId?: string;
  transactionId?: string;
  reason?: string;
}
export interface RefundPaymentResult {
  success: boolean;
  orderId: string;
  refunded: boolean;
  reason?: string;
}
