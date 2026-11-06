import { Controller, UseInterceptors } from '@nestjs/common';
import { RMQ_PATTERN, RmqManualAckInterceptor } from '@repo/common';
import { OrderService } from './order.service';
import { OrderSagaOrchestrator } from './saga/order-saga.orchestrator';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
@UseInterceptors(RmqManualAckInterceptor)
export class RpcOrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly saga: OrderSagaOrchestrator,
  ) {}

  @MessagePattern(RMQ_PATTERN.ORDER.CREATE)
  async create(@Payload() dto: CreateOrderDto) {
    const order = await this.orderService.create(dto);
    return this.saga.run(order);
  }

  @MessagePattern(RMQ_PATTERN.ORDER.FIND_ALL)
  findAll() {
    return this.orderService.findAll();
  }

  @MessagePattern(RMQ_PATTERN.ORDER.FIND_ONE)
  findOne(@Payload() id: string) {
    return this.orderService.findOne(id);
  }
}
