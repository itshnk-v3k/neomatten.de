import { IsNotEmpty, IsString, Matches } from 'class-validator';

/** snake_case: lowercase alphanumeric segments joined by single underscores. */
const SNAKE_CASE = /^[a-z0-9]+(_[a-z0-9]+)*$/;

/** Body for renaming a translation key. */
export class RenameKeyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(SNAKE_CASE, {
    message:
      'newKey must be snake_case (lowercase, digits, single underscores)',
  })
  newKey!: string;
}
