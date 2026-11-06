import { Controller, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RMQ_PATTERN } from '@repo/common';
import { OrderService } from './order.service';
import { OrderSagaOrchestrator } from './saga/order-saga.orchestrator';
import { CreateOrderDto } from './dto/create-order.dto';
import { retry } from 'rxjs';

@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly saga: OrderSagaOrchestrator,
  ) {}
}
