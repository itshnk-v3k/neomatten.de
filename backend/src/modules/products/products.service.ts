import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Public (read-only, active products only) ---

  findAll() {
    return this.prisma.product.findMany({ where: { isActive: true } });
  }

  findOne(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  // --- Admin ---

  /** All products (active AND inactive), newest first. */
  findAllAdmin() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          nameDE: dto.nameDE,
          nameEN: dto.nameEN,
          slug: dto.slug,
          type: dto.type,
          basePrice: dto.basePrice,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (error) {
      throw this.toDomainError(error);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.toDomainError(error);
    }
  }

  /**
   * Hard delete. Safe: OrderItem has NO foreign key to Product — it stores a
   * denormalized `productType` string + `configuration` JSON, so removing a
   * Product never orphans an order line. (Use PATCH isActive:false for a soft
   * hide.)
   */
  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return { id };
    } catch (error) {
      throw this.toDomainError(error);
    }
  }

  /** Maps Prisma constraint errors to HTTP exceptions (409 slug / 404 missing). */
  private toDomainError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException('A product with this slug already exists');
      }
      if (error.code === 'P2025') {
        return new NotFoundException('Product not found');
      }
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}
