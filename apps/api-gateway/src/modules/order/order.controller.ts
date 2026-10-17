import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo order và chạy saga xử lý đơn hàng' })
  async create(@Body() body: CreateOrderDto) {
    return this.orderService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách order' })
  async findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một order' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }
}
