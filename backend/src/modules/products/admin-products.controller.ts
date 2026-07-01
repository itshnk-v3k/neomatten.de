import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

/**
 * Admin products CRUD. All routes require a valid JWT AND admin privileges
 * (JwtAuthGuard populates request.user, AdminGuard checks isAdmin). Unlike the
 * public GET /products (active only), the admin list returns every product.
 */
@ApiTags('admin/products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products, active and inactive (admin).' })
  list() {
    return this.products.findAllAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Create a product (admin). 409 on slug collision.' })
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (admin). 409 on slug collision.' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hard-delete a product (admin). No OrderItem FK.' })
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
