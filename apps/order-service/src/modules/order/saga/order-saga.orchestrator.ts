import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RMQ_CLIENT, RMQ_PATTERN, KAFKA_TOPIC } from '@repo/common';
import { OutboxService } from '@repo/database';
import { Order, OrderStatus } from '../../../entities/order.entity';
import {
  SagaState,
  SagaStatus,
  SagaStep,
  StepStatus,
} from '../../../entities/saga-state.entity';
import { OrderService } from '../order.service';
import { ResilientRpcService } from './resilient-rpc.service';
import {
  CheckAvailabilityResult,
  ProcessPaymentResult,
  ReleaseInventoryResult,
  ReserveInventoryResult,
} from './saga.types';

/**
 * Orchestrator điều phối saga xử lý đơn hàng (chạy in-process trong
 * order-service). Gọi tuần tự product → inventory → payment qua RMQ
 * request-reply, lưu tiến trình vào saga_states, và chạy compensation
 * (release inventory, refund payment) khi một bước fail.
 *
 * Mọi handler downstream trả về { success, reason } thay vì throw khi lỗi
 * nghiệp vụ, nên ta vừa branch theo result.success vừa bọc try/catch cho
 * lỗi transport/hạ tầng.
 */
@Injectable()
export class OrderSagaOrchestrator {
  private readonly logger = new Logger(OrderSagaOrchestrator.name);

  constructor(
    @Inject(RMQ_CLIENT.PRODUCT) private readonly productClient: ClientProxy,
    @Inject(RMQ_CLIENT.INVENTORY) private readonly inventoryClient: ClientProxy,
    @Inject(RMQ_CLIENT.PAYMENT) private readonly paymentClient: ClientProxy,
    @InjectRepository(SagaState)
    private readonly sagaRepo: Repository<SagaState>,
    private readonly orderService: OrderService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
    private readonly rpcService: ResilientRpcService,
  ) {}

  /**
   * Chạy toàn bộ saga cho một order đã ở trạng thái PENDING.
   * Trả về order sau cùng (CONFIRMED / CANCELLED / FAILED).
   */
  async run(order: Order): Promise<Order> {
    const orderId = order.id;
    const saga = await this.startSaga(orderId);
    this.logger.log(`Saga ${saga.id} started for order ${orderId}`);

    // ---- Bước 1: validate product + lấy giá chuẩn ----
    const check = await this.validateProduct(saga, order);
    if (!check) {
      return this.orderService.findOne(orderId);
    }

    // ---- Bước 2: giữ tồn kho ----
    const reserved = await this.reserveInventory(saga, order);
    if (!reserved) {
      return this.orderService.findOne(orderId);
    }

    // ---- Bước 3: thanh toán ----
    const paid = await this.processPayment(saga, order, check.totalAmount);
    if (!paid) {
      return this.orderService.findOne(orderId);
    }

    // ---- Bước 4: xác nhận order ----
    await this.confirmOrder(saga, orderId);
    return this.orderService.findOne(orderId);
  }

  // =====================================================================
  // Forward steps
  // =====================================================================

  private async validateProduct(
    saga: SagaState,
    order: Order,
  ): Promise<CheckAvailabilityResult | null> {
    await this.beginStep(saga, SagaStep.VALIDATE_PRODUCT);
    const req = {
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    let result: CheckAvailabilityResult;
    try {
      result = await this.rpcService.send<CheckAvailabilityResult>(
        'product',
        this.productClient,
        RMQ_PATTERN.PRODUCT.CHECK_AVAILABILITY,
        req,
      );
    } catch (err) {
      await this.failEarly(
        saga,
        order.id,
        SagaStep.VALIDATE_PRODUCT,
        `PRODUCT_SERVICE_UNAVAILABLE: ${this.errMsg(err)}`,
      );
      return null;
    }

    if (!result.available) {
      await this.failEarly(
        saga,
        order.id,
        SagaStep.VALIDATE_PRODUCT,
        result.reason ?? 'PRODUCT_NOT_AVAILABLE',
      );
      return null;
    }

    // Ghi giá chuẩn + tổng tiền từ product-service vào order (không tin client).
    await this.orderService.applyPricing(
      order.id,
      result.items,
      result.totalAmount,
    );
    await this.markStep(saga, SagaStep.VALIDATE_PRODUCT, StepStatus.SUCCESS);
    return result;
  }

  private async reserveInventory(
    saga: SagaState,
    order: Order,
  ): Promise<boolean> {
    await this.beginStep(saga, SagaStep.RESERVE_INVENTORY);
    const req = {
      orderId: order.id,
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    let result: ReserveInventoryResult;
    try {
      result = await this.rpcService.send<ReserveInventoryResult>(
        'inventory',
        this.inventoryClient,
        RMQ_PATTERN.INVENTORY.RESERVE,
        req,
      );
    } catch (err) {
      // Lỗi transport: không chắc đã giữ hàng hay chưa. release là idempotent
      // nên gọi bù trừ cho an toàn, rồi hủy order.
      await this.markStep(
        saga,
        SagaStep.RESERVE_INVENTORY,
        StepStatus.FAILED,
        this.errMsg(err),
      );
      await this.compensateInventory(saga, order.id);
      await this.cancelOrder(
        saga,
        order.id,
        `INVENTORY_SERVICE_UNAVAILABLE: ${this.errMsg(err)}`,
      );
      return false;
    }

    if (!result.success) {
      // Lỗi nghiệp vụ (hết hàng): chưa giữ được gì → không cần bù trừ, chỉ hủy.
      const reason = this.describeShortage(result);
      await this.markStep(
        saga,
        SagaStep.RESERVE_INVENTORY,
        StepStatus.FAILED,
        reason,
      );
      await this.cancelOrder(saga, order.id, reason);
      return false;
    }

    await this.markStep(saga, SagaStep.RESERVE_INVENTORY, StepStatus.SUCCESS);
    return true;
  }

  private async processPayment(
    saga: SagaState,
    order: Order,
    amount: number,
  ): Promise<boolean> {
    await this.beginStep(saga, SagaStep.PROCESS_PAYMENT);
    const req = { orderId: order.id, amount };

    let result: ProcessPaymentResult;
    try {
      result = await this.rpcService.send<ProcessPaymentResult>(
        'payment',
        this.paymentClient,
        RMQ_PATTERN.PAYMENT.PROCESS,
        req,
      );
    } catch (err) {
      result = {
        success: false,
        orderId: order.id,
        reason: `PAYMENT_SERVICE_UNAVAILABLE: ${this.errMsg(err)}`,
      };
    }

    if (!result.success) {
      const reason = result.reason ?? 'PAYMENT_DECLINED';
      await this.markStep(
        saga,
        SagaStep.PROCESS_PAYMENT,
        StepStatus.FAILED,
        reason,
      );
      // Compensation: nhả tồn kho đã giữ, rồi hủy order.
      await this.compensateInventory(saga, order.id);
      await this.cancelOrder(saga, order.id, reason);
      return false;
    }

    await this.markStep(saga, SagaStep.PROCESS_PAYMENT, StepStatus.SUCCESS);
    return true;
  }

  private async confirmOrder(saga: SagaState, orderId: string): Promise<void> {
    await this.beginStep(saga, SagaStep.CONFIRM_ORDER);
    this.appendStepInMemory(saga, {
      step: SagaStep.CONFIRM_ORDER,
      status: StepStatus.SUCCESS,
    });
    saga.status = SagaStatus.COMPLETED;
    saga.currentStep = null;

    await this.finalize(
      orderId,
      OrderStatus.CONFIRMED,
      null,
      saga,
      KAFKA_TOPIC.ORDER_CONFIRMED,
      { orderId },
    );
    this.logger.log(`Saga ${saga.id} completed, order ${orderId} CONFIRMED`);
  }

  // =====================================================================
  // Compensation + terminal outcomes
  // =====================================================================

  /** Nhả tồn kho đã giữ (idempotent bên inventory-service, best-effort). */
  private async compensateInventory(
    saga: SagaState,
    orderId: string,
  ): Promise<void> {
    try {
      const res = await this.rpcService.send<ReleaseInventoryResult>(
        'inventory',
        this.inventoryClient,
        RMQ_PATTERN.INVENTORY.RELEASE,
        { orderId },
        { retries: 3 },
      );
      await this.appendStep(saga, {
        step: 'RELEASE_INVENTORY',
        status: StepStatus.COMPENSATED,
        reason: res.released
          ? 'released'
          : (res.reason ?? 'nothing_to_release'),
      });
    } catch (err) {
      this.logger.error(
        `Compensation release inventory failed for order ${orderId}: ${this.errMsg(err)}`,
      );
      await this.appendStep(saga, {
        step: 'RELEASE_INVENTORY',
        status: StepStatus.FAILED,
        reason: this.errMsg(err),
      });
    }
  }

  /**
   * Hủy order sau khi đã chạy (hoặc không cần) bù trừ.
   * Đánh dấu saga COMPENSATED + publish ORDER_CANCELLED cho notification.
   */
  private async cancelOrder(
    saga: SagaState,
    orderId: string,
    reason: string,
  ): Promise<void> {
    saga.status = SagaStatus.COMPENSATED;
    saga.failureReason = reason;
    saga.currentStep = null;

    await this.finalize(
      orderId,
      OrderStatus.CANCELLED,
      reason,
      saga,
      KAFKA_TOPIC.ORDER_CANCELLED,
      { orderId, reason },
    );
    this.logger.warn(`Order ${orderId} CANCELLED (reason: ${reason})`);
  }

  /**
   * Fail sớm, không có bước nào cần bù trừ (vd validate product fail).
   * Order → FAILED, saga → FAILED, publish ORDER_FAILED.
   */
  private async failEarly(
    saga: SagaState,
    orderId: string,
    step: SagaStep,
    reason: string,
  ): Promise<void> {
    saga.status = SagaStatus.COMPENSATING;
    this.appendStepInMemory(saga, {
      step,
      status: StepStatus.FAILED,
      reason,
    });
    saga.status = SagaStatus.FAILED;
    saga.failureReason = reason;
    saga.currentStep = null;

    await this.finalize(
      orderId,
      OrderStatus.FAILED,
      reason,
      saga,
      KAFKA_TOPIC.ORDER_FAILED,
      { orderId, reason },
    );
    this.logger.warn(`Order ${orderId} FAILED at ${step} (reason: ${reason})`);
  }

  // =====================================================================
  // Helpers
  // =====================================================================

  private async startSaga(orderId: string): Promise<SagaState> {
    const existing = await this.sagaRepo.findOne({ where: { orderId } });
    if (existing) return existing;
    const saga = this.sagaRepo.create({
      orderId,
      status: SagaStatus.RUNNING,
      currentStep: null,
      steps: [],
      failureReason: null,
    });
    return this.sagaRepo.save(saga);
  }

  private async beginStep(saga: SagaState, step: SagaStep): Promise<void> {
    saga.currentStep = step;
    saga.status = SagaStatus.RUNNING;
    await this.appendStep(saga, { step, status: StepStatus.STARTED });
  }

  private async markStep(
    saga: SagaState,
    step: SagaStep,
    status: StepStatus,
    reason?: string,
  ): Promise<void> {
    if (status === StepStatus.FAILED) {
      saga.status = SagaStatus.COMPENSATING;
    }
    await this.appendStep(saga, { step, status, reason });
  }

  private async appendStep(
    saga: SagaState,
    entry: { step: SagaStep | string; status: StepStatus; reason?: string },
  ): Promise<void> {
    this.appendStepInMemory(saga, entry);
    await this.sagaRepo.save(saga);
  }

  /** Append log vào saga nhưng chưa persist (dùng khi sẽ lưu trong finalize). */
  private appendStepInMemory(
    saga: SagaState,
    entry: { step: SagaStep | string; status: StepStatus; reason?: string },
  ): void {
    saga.steps = [
      ...(saga.steps ?? []),
      { ...entry, at: new Date().toISOString() },
    ];
  }

  /**
   * Chốt trạng thái cuối của saga trong MỘT transaction:
   *   1) cập nhật status order
   *   2) lưu saga state
   *   3) ghi domain event vào outbox (Transactional Outbox)
   * Nhờ cùng commit, không bao giờ xảy ra "đổi trạng thái mà không phát event"
   * hoặc ngược lại. Relay sẽ publish outbox event lên Kafka sau đó.
   */
  private async finalize(
    orderId: string,
    orderStatus: OrderStatus,
    failureReason: string | null,
    saga: SagaState,
    eventType: string,
    eventData: { orderId: string; reason?: string },
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Order,
        { id: orderId },
        {
          status: orderStatus,
          ...(failureReason !== null ? { failureReason } : {}),
        },
      );
      await manager.save(SagaState, saga);
      await this.outboxService.saveInTransaction(manager as any, {
        aggregateType: 'order',
        aggregateId: orderId,
        eventType,
        payload: eventData,
        partitionKey: orderId,
      });
    });
  }

  private describeShortage(result: ReserveInventoryResult): string {
    const base = result.reason ?? 'INSUFFICIENT_STOCK';
    if (!result.shortages?.length) return base;
    const detail = result.shortages
      .map((s) => `${s.productId}(req ${s.requested}/avail ${s.available})`)
      .join(', ');
    return `${base}: ${detail}`;
  }

  private errMsg(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return 'unknown error';
    }
  }
}
