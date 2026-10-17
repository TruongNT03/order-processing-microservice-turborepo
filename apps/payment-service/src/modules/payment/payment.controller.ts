import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { RMQ_PATTERN } from "@repo/common";
import { PaymentService } from "./payment.service";
import {
  ProcessPaymentRequest,
  RefundPaymentRequest,
} from "./dto/process-payment.dto";

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(RMQ_PATTERN.PAYMENT.PROCESS)
  process(@Payload() req: ProcessPaymentRequest) {
    return this.paymentService.process(req);
  }

  @MessagePattern(RMQ_PATTERN.PAYMENT.REFUND)
  refund(@Payload() req: RefundPaymentRequest) {
    return this.paymentService.refund(req);
  }

  @MessagePattern(RMQ_PATTERN.PAYMENT.FIND_ONE)
  findOne(@Payload() orderId: string) {
    return this.paymentService.findOne(orderId);
  }
}
