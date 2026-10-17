import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Inventory } from '../../entities/inventory.entity';
import {
  Reservation,
  ReservationStatus,
} from '../../entities/reservation.entity';
import {
  AdjustInventoryRequest,
  ReleaseInventoryRequest,
  ReleaseInventoryResult,
  ReserveInventoryRequest,
  ReserveInventoryResult,
} from './dto/reserve-inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    private readonly dataSource: DataSource,
  ) {}

  async findOne(productId: string): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({ where: { productId } });
    if (!inv) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }
    return inv;
  }

  async reserve(req: ReserveInventoryRequest): Promise<ReserveInventoryResult> {
    const { orderId, items } = req;

    return;
    // return this.dataSource.transaction(async (manager) => {
    //   const existing = await manager.findOne(Reservation, {
    //     where: { orderId, status: ReservationStatus.RESERVED },
    //   });
    //   if (existing) {
    //     this.logger.warn(
    //       `Reservation already exists for order ${orderId}, skip (idempotent)`,
    //     );
    //     return {
    //       success: true,
    //       orderId,
    //       reservationId: existing.id,
    //     };
    //   }

    //   const shortages: ReserveInventoryResult['shortages'] = [];

    //   const locked = new Map<string, Inventory>();
    //   for (const item of items) {
    //     const inv = await manager
    //       .getRepository(Inventory)
    //       .createQueryBuilder('inv')
    //       .setLock('pessimistic_write')
    //       .where('inv.productId = :productId', { productId: item.productId })
    //       .getOne();

    //     if (!inv) {
    //       shortages.push({
    //         productId: item.productId,
    //         requested: item.quantity,
    //         available: 0,
    //       });
    //       continue;
    //     }

    //     if (inv.available < item.quantity) {
    //       shortages.push({
    //         productId: item.productId,
    //         requested: item.quantity,
    //         available: inv.available,
    //       });
    //       continue;
    //     }
    //     locked.set(item.productId, inv);
    //   }

    //   if (shortages.length > 0) {
    //     this.logger.warn(
    //       `Reserve failed for order ${orderId}: insufficient stock`,
    //     );
    //     return {
    //       success: false,
    //       orderId,
    //       reason: 'INSUFFICIENT_STOCK',
    //       shortages,
    //     };
    //   }

    //   for (const item of items) {
    //     const inv = locked.get(item.productId)!;
    //     inv.reserved += item.quantity;
    //     await manager.save(inv);
    //   }

    //   const reservation = manager.create(Reservation, {
    //     orderId,
    //     items: items.map((i) => ({
    //       productId: i.productId,
    //       quantity: i.quantity,
    //     })),
    //     status: ReservationStatus.RESERVED,
    //   });
    //   await manager.save(reservation);

    //   this.logger.log(
    //     `Reserved inventory for order ${orderId} (reservation ${reservation.id})`,
    //   );
    //   return {
    //     success: true,
    //     orderId,
    //     reservationId: reservation.id,
    //   };
    // });
  }

  async release(req: ReleaseInventoryRequest): Promise<ReleaseInventoryResult> {
    const { orderId } = req;

    return;
    // return this.dataSource.transaction(async (manager) => {
    //   const reservation = await manager.findOne(Reservation, {
    //     where: { orderId, status: ReservationStatus.RESERVED },
    //   });

    //   if (!reservation) {
    //     this.logger.warn(
    //       `No active reservation to release for order ${orderId} (idempotent)`,
    //     );
    //     return { success: true, orderId, released: false };
    //   }

    //   for (const line of reservation.items) {
    //     const inv = await manager
    //       .getRepository(Inventory)
    //       .createQueryBuilder('inv')
    //       .setLock('pessimistic_write')
    //       .where('inv.productId = :productId', { productId: line.productId })
    //       .getOne();
    //     if (!inv) {
    //       continue;
    //     }
    //     inv.reserved = Math.max(0, inv.reserved - line.quantity);
    //     await manager.save(inv);
    //   }

    //   reservation.status = ReservationStatus.RELEASED;
    //   await manager.save(reservation);

    //   this.logger.log(`Released inventory for order ${orderId}`);
    //   return { success: true, orderId, released: true };
    // });
  }

  async adjust(req: AdjustInventoryRequest): Promise<Inventory> {
    const { productId, delta } = req;

    return;
    // return this.dataSource.transaction(async (manager) => {
    //   let inv = await manager
    //     .getRepository(Inventory)
    //     .createQueryBuilder('inv')
    //     .setLock('pessimistic_write')
    //     .where('inv.productId = :productId', { productId })
    //     .getOne();

    //   if (!inv) {
    //     inv = manager.create(Inventory, {
    //       productId,
    //       quantity: 0,
    //       reserved: 0,
    //     });
    //   }
    //   inv.quantity = Math.max(0, inv.quantity + delta);
    //   return manager.save(inv);
    // });
  }
}
