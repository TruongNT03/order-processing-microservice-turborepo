import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { Payment, PaymentStatus } from "../../entities/payment.entity";
import {
  ProcessPaymentRequest,
  ProcessPaymentResult,
  RefundPaymentRequest,
  RefundPaymentResult,
} from "./dto/process-payment.dto";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly failRate: number;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {
    // Tỉ lệ fail giả lập, mặc định 20% để demo compensation
    this.failRate = Number(this.config.get("PAYMENT_FAIL_RATE") ?? 0.2);
  }

  /**
   * Xử lý thanh toán (bước ProcessPayment trong saga).
   *
   * Idempotent theo orderId (unique): nếu đã có payment SUCCESS cho order thì
   * trả lại kết quả cũ, tránh tính tiền 2 lần khi message bị gửi lại.
   */
  async process(req: ProcessPaymentRequest): Promise<ProcessPaymentResult> {
    const { orderId, amount } = req;

    const existing = await this.paymentRepo.findOne({ where: { orderId } });
    if (existing && existing.status === PaymentStatus.SUCCESS) {
      this.logger.warn(
        `Payment already processed for order ${orderId} (idempotent)`,
      );
      return {
        success: true,
        orderId,
        paymentId: existing.id,
        transactionId: existing.transactionId ?? undefined,
      };
    }

    const willFail = Math.random() < this.failRate;

    if (willFail) {
      const payment = await this.paymentRepo.save(
        this.paymentRepo.create({
          orderId,
          amount,
          status: PaymentStatus.FAILED,
          failureReason: "PAYMENT_DECLINED",
        }),
      );
      this.logger.warn(`Payment FAILED for order ${orderId}`);
      return {
        success: false,
        orderId,
        paymentId: payment.id,
        reason: "PAYMENT_DECLINED",
      };
    }

    const transactionId = `txn_${randomUUID()}`;
    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        orderId,
        amount,
        status: PaymentStatus.SUCCESS,
        transactionId,
      }),
    );
    this.logger.log(`Payment SUCCESS for order ${orderId} (${transactionId})`);
    return {
      success: true,
      orderId,
      paymentId: payment.id,
      transactionId,
    };
  }

  /**
   * Hoàn tiền (bước compensation RefundPayment).
   * Idempotent: chỉ hoàn cho payment đang SUCCESS; các trạng thái khác coi
   * như không cần hoàn và vẫn trả success.
   */
  async refund(req: RefundPaymentRequest): Promise<RefundPaymentResult> {
    const { orderId } = req;
    const payment = await this.paymentRepo.findOne({ where: { orderId } });

    if (!payment || payment.status !== PaymentStatus.SUCCESS) {
      this.logger.warn(
        `No successful payment to refund for order ${orderId} (idempotent)`,
      );
      return { success: true, orderId, refunded: false };
    }

    payment.status = PaymentStatus.REFUNDED;
    await this.paymentRepo.save(payment);
    this.logger.log(`Payment REFUNDED for order ${orderId}`);
    return { success: true, orderId, refunded: true };
  }

  async findOne(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }
    return payment;
  }
}
