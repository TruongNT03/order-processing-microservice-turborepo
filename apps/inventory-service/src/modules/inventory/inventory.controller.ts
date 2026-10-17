import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RMQ_PATTERN } from '@repo/common';
import { InventoryService } from './inventory.service';
import {
  AdjustInventoryRequest,
  ReleaseInventoryRequest,
  ReserveInventoryRequest,
} from './dto/reserve-inventory.dto';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern(RMQ_PATTERN.INVENTORY.RESERVE)
  reserve(@Payload() req: ReserveInventoryRequest) {
    return this.inventoryService.reserve(req);
  }

  @MessagePattern(RMQ_PATTERN.INVENTORY.RELEASE)
  release(@Payload() req: ReleaseInventoryRequest) {
    return this.inventoryService.release(req);
  }

  @MessagePattern(RMQ_PATTERN.INVENTORY.FIND_ONE)
  findOne(@Payload() productId: string) {
    return this.inventoryService.findOne(productId);
  }

  @MessagePattern(RMQ_PATTERN.INVENTORY.ADJUST)
  adjust(@Payload() req: AdjustInventoryRequest) {
    return this.inventoryService.adjust(req);
  }
}
