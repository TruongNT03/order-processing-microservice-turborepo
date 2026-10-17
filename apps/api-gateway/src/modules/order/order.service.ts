import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RMQ_CLIENT, RMQ_PATTERN } from '@repo/common';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @Inject(RMQ_CLIENT.ORDER)
    private readonly clientProxy: ClientProxy,
  ) {}

  async create(body: CreateOrderDto) {
    return firstValueFrom(
      this.clientProxy.send(RMQ_PATTERN.ORDER.CREATE, body),
    );
  }

  async findAll() {
    return firstValueFrom(
      this.clientProxy.send(RMQ_PATTERN.ORDER.FIND_ALL, {}),
    );
  }

  async findOne(id: string) {
    return firstValueFrom(
      this.clientProxy.send(RMQ_PATTERN.ORDER.FIND_ONE, id),
    );
  }
}
