import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TranslationsService } from './translations.service';

/**
 * Public translations endpoint — consumed by the main site at bootstrap.
 * No auth: this serves the live/published copy to anonymous visitors.
 */
@ApiTags('translations')
@Controller('translations')
export class TranslationsController {
  constructor(private readonly translations: TranslationsService) {}

  @Get(':locale')
  @ApiOperation({
    summary:
      'Published dictionary for a locale as a flat key → value map (public).',
  })
  getDictionary(@Param('locale') locale: string) {
    return this.translations.publishedDictionary(locale);
  }
}
