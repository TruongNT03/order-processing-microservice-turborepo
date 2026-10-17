/**
 * Payload cho xử lý/hoàn thanh toán. Dùng chung giữa order-service (saga)
 * và payment-service.
 */
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
