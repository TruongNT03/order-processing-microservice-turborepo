import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Body() body: CreateProductDto) {
    return await this.productService.create(body);
  }
}
