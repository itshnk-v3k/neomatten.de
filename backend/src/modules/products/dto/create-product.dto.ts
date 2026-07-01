import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Allowed product families. `Product.type` is a plain string column (no DB
 * enum), so this is the single source of truth for the values the admin may
 * assign. Mirrors the public site's ProductCategory ('mats' | 'cushion' |
 * 'eva_bag' | 'leather_bag').
 */
export const PRODUCT_TYPES = [
  'mats',
  'cushion',
  'eva_bag',
  'leather_bag',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Kebab-case, URL-safe (matches the existing slug convention, e.g. "kk-01"). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateProductDto {
  @ApiProperty({ example: 'Kopfstützenkissen EVA' })
  @IsString()
  @MinLength(1)
  nameDE: string;

  @ApiProperty({ example: 'EVA headrest cushion' })
  @IsString()
  @MinLength(1)
  nameEN: string;

  @ApiProperty({ example: 'kopfstuetzenkissen-eva' })
  @IsString()
  @Matches(SLUG_PATTERN, {
    message:
      'slug must be kebab-case (lowercase letters, digits and single hyphens)',
  })
  slug: string;

  @ApiProperty({ enum: PRODUCT_TYPES, example: 'cushion' })
  @IsIn(PRODUCT_TYPES)
  type: string;

  @ApiProperty({ example: 24, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
