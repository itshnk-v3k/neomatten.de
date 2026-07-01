import { IsString } from 'class-validator';

/** Body for staging a pending edit — only the draft value may change. */
export class UpdateTranslationDto {
  @IsString()
  draftValue!: string;
}
