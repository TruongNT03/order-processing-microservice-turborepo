import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { In, Repository } from 'typeorm';
import {
  CheckAvailabilityRequest,
  CheckAvailabilityResult,
  CheckedProduct,
} from './dto/check-availability.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(body: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      name: body.name,
      description: body.description ?? null,
      price: body.price,
    });
    return this.productRepo.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async update(id: string, body: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, body);
    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const product = await this.findOne(id);
    await this.productRepo.softRemove(product);
    return { success: true };
  }

  /**
   * Dùng trong saga: xác thực các sản phẩm tồn tại và tính tổng tiền.
   * Không kiểm tra tồn kho ở đây (đó là việc của inventory-service),
   * chỉ xác nhận product hợp lệ + lấy giá chuẩn từ nguồn (chống client giả giá).
   */
  async checkAvailability(
    req: CheckAvailabilityRequest,
  ): Promise<CheckAvailabilityResult> {
    const ids = req.items.map((i) => i.productId);
    const products = await this.productRepo.find({ where: { id: In(ids) } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const checked: CheckedProduct[] = [];
    for (const item of req.items) {
      const product = byId.get(item.productId);
      if (!product) {
        return {
          available: false,
          reason: `Product ${item.productId} not found`,
          items: [],
          totalAmount: 0,
        };
      }
      checked.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      });
    }

    const totalAmount = checked.reduce((sum, i) => sum + i.subtotal, 0);
    return { available: true, items: checked, totalAmount };
  }
}
