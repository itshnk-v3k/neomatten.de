import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** Body for POST /auth/exchange — swaps a one-time OAuth code for real tokens. */
export class ExchangeDto {
  @ApiProperty({ description: 'One-time opaque OAuth exchange code.' })
  @IsString()
  @MinLength(1)
  code: string;
}
