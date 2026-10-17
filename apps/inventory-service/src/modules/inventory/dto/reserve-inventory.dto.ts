/**
 * Payload cho các thao tác giữ/nhả tồn kho.
 * Dùng chung interface giữa order-service (saga) và inventory-service.
 */
export interface ReserveItem {
  productId: string;
  quantity: number;
}

export interface ReserveInventoryRequest {
  /** Order gắn với lần giữ tồn này (để release đúng và chống trùng) */
  orderId: string;
  items: ReserveItem[];
}

export interface ReleaseInventoryRequest {
  orderId: string;
}

export interface AdjustInventoryRequest {
  productId: string;
  /** Số lượng cộng thêm vào kho (có thể âm để trừ) */
  delta: number;
}

export interface ReserveInventoryResult {
  success: boolean;
  orderId: string;
  reservationId?: string;
  /** Lý do thất bại (vd: hết hàng, product chưa có inventory) */
  reason?: string;
  /** Chi tiết dòng không đủ hàng, phục vụ debug/thông báo */
  shortages?: { productId: string; requested: number; available: number }[];
}

export interface ReleaseInventoryResult {
  success: boolean;
  orderId: string;
  released: boolean;
  reason?: string;
}
