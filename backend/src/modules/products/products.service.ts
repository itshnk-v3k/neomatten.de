import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({ where: { isActive: true } });
  }

  findOne(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }
}
