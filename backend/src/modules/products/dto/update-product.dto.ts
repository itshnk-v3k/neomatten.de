import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/** Update body — every field of CreateProductDto is optional (same validation). */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
