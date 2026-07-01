import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RenameKeyDto } from './dto/rename-key.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';
import { TranslationsService } from './translations.service';

/**
 * Admin translations editor API. All routes require a valid JWT AND admin
 * privileges (JwtAuthGuard populates request.user, AdminGuard checks isAdmin).
 */
@ApiTags('admin/translations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/translations')
export class AdminTranslationsController {
  constructor(private readonly translations: TranslationsService) {}

  @Get()
  @ApiOperation({ summary: 'Full editable translation list (admin).' })
  list() {
    return this.translations.listAll();
  }

  @Get('pending-count')
  @ApiOperation({ summary: 'Count of rows with a pending draft (admin).' })
  pendingCount() {
    return this.translations.pendingCount();
  }

  @Get('renamed')
  @ApiOperation({
    summary: 'Unique { oldKey, newKey } pairs for renamed keys (admin).',
  })
  renamed() {
    return this.translations.listRenamed();
  }

  @Patch(':id/rename-key')
  @ApiOperation({
    summary: 'Rename a key (both locales); aliases the old key (admin).',
  })
  renameKey(@Param('id') id: string, @Body() dto: RenameKeyDto) {
    return this.translations.renameKey(id, dto.newKey);
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish all pending drafts live (admin).' })
  publish() {
    return this.translations.publish();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Stage a pending edit (draftValue only) (admin).' })
  update(@Param('id') id: string, @Body() dto: UpdateTranslationDto) {
    return this.translations.updateDraft(id, dto.draftValue);
  }
}
