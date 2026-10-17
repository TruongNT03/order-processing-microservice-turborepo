import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { RMQ_PATTERN } from '@repo/common';
import { CheckAvailabilityRequest } from './dto/check-availability.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern(RMQ_PATTERN.PRODUCT.CREATE)
  create(@Payload() body: CreateProductDto) {
    return this.productService.create(body);
  }

  @MessagePattern(RMQ_PATTERN.PRODUCT.FIND_ALL)
  findAll() {
    return this.productService.findAll();
  }

  @MessagePattern(RMQ_PATTERN.PRODUCT.FIND_ONE)
  findOne(@Payload() id: string) {
    return this.productService.findOne(id);
  }

  @MessagePattern(RMQ_PATTERN.PRODUCT.UPDATE)
  update(@Payload() payload: { id: string; data: Partial<CreateProductDto> }) {
    return this.productService.update(payload.id, payload.data);
  }

  @MessagePattern(RMQ_PATTERN.PRODUCT.REMOVE)
  remove(@Payload() id: string) {
    return this.productService.remove(id);
  }

  @MessagePattern(RMQ_PATTERN.PRODUCT.CHECK_AVAILABILITY)
  checkAvailability(@Payload() req: CheckAvailabilityRequest) {
    return this.productService.checkAvailability(req);
  }
}
