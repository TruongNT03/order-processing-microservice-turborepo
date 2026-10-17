import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepo.create({
      userId: dto.userId ?? null,
      status: OrderStatus.PENDING,
      totalAmount: 0,
      items: dto.items.map((i) =>
        this.orderItemRepo.create({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: 0,
        }),
      ),
    });

    const saved = await this.orderRepo.save(order);
    this.logger.log(`Created order ${saved.id} (PENDING)`);
    return saved;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    failureReason?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    if (failureReason !== undefined) {
      order.failureReason = failureReason;
    }
    return this.orderRepo.save(order);
  }

  /**
   * Ghi giá chuẩn (lấy từ product-service) vào từng order item và tổng tiền
   * của order. Gọi ở bước validate của saga để order không tin giá client.
   */
  async applyPricing(
    orderId: string,
    pricedItems: {
      productId: string;
      name?: string;
      price: number;
    }[],
    totalAmount: number,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    const priceByProduct = new Map(pricedItems.map((p) => [p.productId, p]));

    for (const item of order.items) {
      const priced = priceByProduct.get(item.productId);
      if (priced) {
        item.unitPrice = priced.price;
        item.productName = priced.name ?? item.productName;
      }
    }

    order.totalAmount = totalAmount;
    const saved = await this.orderRepo.save(order);
    this.logger.log(
      `Applied pricing to order ${orderId} (total=${totalAmount})`,
    );
    return saved;
  }
}
