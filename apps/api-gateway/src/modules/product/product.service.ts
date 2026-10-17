import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  constructor(
    @Inject('PRODUCT_SERVICE')
    private readonly clientProxy: ClientProxy,
  ) {}
  async create(body: CreateProductDto) {
    const product = await firstValueFrom(
      this.clientProxy.send('product.create', body),
    );

    return product;
  }
}
