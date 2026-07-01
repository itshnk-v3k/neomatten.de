import { Module } from '@nestjs/common';
import { AdminTranslationsController } from './admin-translations.controller';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';

@Module({
  controllers: [TranslationsController, AdminTranslationsController],
  providers: [TranslationsService],
  exports: [TranslationsService],
})
export class TranslationsModule {}
