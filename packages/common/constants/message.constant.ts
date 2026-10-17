export const RMQ_QUEUE = {
  PRODUCT: "product_queue",
  ORDER: "order_queue",
  INVENTORY: "inventory_queue",
  PAYMENT: "payment_queue",
  NOTIFICATION: "notification_queue",
  AUTH: "auth_queue",
} as const;

export const RMQ_CLIENT = {
  PRODUCT: "PRODUCT_SERVICE",
  ORDER: "ORDER_SERVICE",
  INVENTORY: "INVENTORY_SERVICE",
  PAYMENT: "PAYMENT_SERVICE",
  NOTIFICATION: "NOTIFICATION_SERVICE",
  AUTH: "AUTH_SERVICE",
  KAFKA: "KAFKA_SERVICE",
} as const;

export const RMQ_PATTERN = {
  PRODUCT: {
    CREATE: "product.create",
    FIND_ALL: "product.find_all",
    FIND_ONE: "product.find_one",
    UPDATE: "product.update",
    REMOVE: "product.remove",
    CHECK_AVAILABILITY: "product.check_availability",
  },
  INVENTORY: {
    RESERVE: "inventory.reserve",
    RELEASE: "inventory.release",
    FIND_ONE: "inventory.find_one",
    ADJUST: "inventory.adjust",
  },
  PAYMENT: {
    PROCESS: "payment.process",
    REFUND: "payment.refund",
    FIND_ONE: "payment.find_one",
  },
  ORDER: {
    CREATE: "order.create",
    FIND_ONE: "order.find_one",
    FIND_ALL: "order.find_all",
  },
  AUTH: {
    REGISTER: "auth.register",
    LOGIN: "auth.login",
    VALIDATE_TOKEN: "auth.validate_token",
  },
} as const;
export const KAFKA_TOPIC = {
  ORDER_CREATED: "order.created",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_FAILED: "order.failed",

  INVENTORY_RESERVED: "inventory.reserved",
  INVENTORY_RESERVATION_FAILED: "inventory.reservation_failed",
  INVENTORY_RELEASED: "inventory.released",

  PAYMENT_PROCESSED: "payment.processed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
} as const;

export const KAFKA_GROUP = {
  ORDER: "order-service-group",
  INVENTORY: "inventory-service-group",
  PAYMENT: "payment-service-group",
  NOTIFICATION: "notification-service-group",
} as const;

export const MessageName = {
  RMQ_QUEUE,
  RMQ_CLIENT,
  RMQ_PATTERN,
  KAFKA_TOPIC,
  KAFKA_GROUP,
} as const;
