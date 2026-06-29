import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description:
      'A valid refresh token previously issued by /auth/login or /auth/register.',
  })
  @IsString()
  refreshToken: string;
}
