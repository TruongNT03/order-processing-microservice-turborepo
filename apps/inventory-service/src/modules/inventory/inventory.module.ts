import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from '../../entities/inventory.entity';
import { Reservation } from '../../entities/reservation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, Reservation])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
