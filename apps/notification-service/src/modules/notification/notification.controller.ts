import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC, EventEnvelope } from '@repo/common';
import { NotificationService } from './notification.service';

type OrderEvent = EventEnvelope<{ orderId: string; reason?: string }>;

/**
 * Lắng nghe domain event trên Kafka và tạo thông báo tương ứng.
 * Mỗi handler ứng với một topic trong KAFKA_TOPIC.
 *
 * Dùng Inbox (idempotency) pattern: envelope.messageId định danh message,
 * recordOnce đảm bảo không ghi trùng khi broker giao lại (at-least-once).
 */
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(KAFKA_TOPIC.ORDER_CONFIRMED)
  async onOrderConfirmed(@Payload() event: OrderEvent) {
    const orderId = event?.data?.orderId;
    await this.notificationService.recordOnce(
      event.messageId,
      'onOrderConfirmed',
      {
        orderId,
        eventType: KAFKA_TOPIC.ORDER_CONFIRMED,
        message: `Đơn hàng ${orderId} đã được xác nhận thành công.`,
        payload: event?.data,
      },
    );
  }

  @EventPattern(KAFKA_TOPIC.ORDER_CANCELLED)
  async onOrderCancelled(@Payload() event: OrderEvent) {
    const orderId = event?.data?.orderId;
    const reason = event?.data?.reason ?? 'không rõ';
    await this.notificationService.recordOnce(
      event.messageId,
      'onOrderCancelled',
      {
        orderId,
        eventType: KAFKA_TOPIC.ORDER_CANCELLED,
        message: `Đơn hàng ${orderId} đã bị hủy (lý do: ${reason}).`,
        payload: event?.data,
      },
    );
  }

  @EventPattern(KAFKA_TOPIC.ORDER_FAILED)
  async onOrderFailed(@Payload() event: OrderEvent) {
    const orderId = event?.data?.orderId;
    const reason = event?.data?.reason ?? 'không rõ';
    await this.notificationService.recordOnce(
      event.messageId,
      'onOrderFailed',
      {
        orderId,
        eventType: KAFKA_TOPIC.ORDER_FAILED,
        message: `Đơn hàng ${orderId} xử lý thất bại (lý do: ${reason}).`,
        payload: event?.data,
      },
    );
  }
}
