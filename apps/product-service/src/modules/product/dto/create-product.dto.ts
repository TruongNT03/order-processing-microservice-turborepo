import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Latest Apple smartphone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  @IsPositive()
  price: number;
}
