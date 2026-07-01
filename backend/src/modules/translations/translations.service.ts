import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Setting key that records the last publish time (cache-bust signal). */
const PUBLISHED_AT_KEY = 'translationsPublishedAt';

@Injectable()
export class TranslationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: the live dictionary for a locale as a flat key → value map,
   * matching the exact shape the main site's TranslationService loads today
   * (a single-level Record<string, string>).
   */
  async publishedDictionary(locale: string): Promise<Record<string, string>> {
    const rows = await this.prisma.translation.findMany({
      where: { locale },
      select: { key: true, value: true },
    });
    const dictionary: Record<string, string> = {};
    for (const row of rows) {
      dictionary[row.key] = row.value;
    }
    return dictionary;
  }

  /** Admin: the full editable list, grouped-friendly (ordered by category → key → locale). */
  listAll() {
    return this.prisma.translation.findMany({
      select: {
        id: true,
        key: true,
        locale: true,
        category: true,
        value: true,
        draftValue: true,
        updatedAt: true,
      },
      orderBy: [{ category: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    });
  }

  /**
   * Admin: stage a pending edit. Only `draftValue` is touched — the live
   * `value` is never changed here. If the draft equals the live value we clear
   * it (null) so "has a pending change" stays equivalent to "draftValue != null".
   */
  async updateDraft(id: string, draftValue: string) {
    const existing = await this.prisma.translation.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Translation not found');
    }
    return this.prisma.translation.update({
      where: { id },
      data: { draftValue: draftValue === existing.value ? null : draftValue },
    });
  }

  /** Admin: number of rows with a pending, unpublished draft (for the nav badge). */
  async pendingCount(): Promise<{ count: number }> {
    const count = await this.prisma.translation.count({
      where: { draftValue: { not: null } },
    });
    return { count };
  }

  /**
   * Admin: publish every pending draft — copy draftValue → value, clear the
   * draft, and bump the `translationsPublishedAt` setting. Runs atomically.
   * Returns the number of rows that went live.
   */
  async publish(): Promise<{ published: number }> {
    return this.prisma.$transaction(async (tx) => {
      // Column-to-column copy in one statement (Prisma updateMany can't do this).
      const published = await tx.$executeRaw`
        UPDATE "translations"
        SET "value" = "draftValue", "draftValue" = NULL
        WHERE "draftValue" IS NOT NULL
      `;

      await tx.setting.upsert({
        where: { key: PUBLISHED_AT_KEY },
        update: { value: new Date().toISOString() },
        create: { key: PUBLISHED_AT_KEY, value: new Date().toISOString() },
      });

      return { published };
    });
  }
}
