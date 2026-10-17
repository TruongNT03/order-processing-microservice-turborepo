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
