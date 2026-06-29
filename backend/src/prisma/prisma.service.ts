import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around the generated Prisma client, wired into Nest's lifecycle
 * so the DB connection opens on boot and closes on shutdown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Non-fatal: the dev server still boots if Postgres isn't running yet, so
    // non-DB routes and Swagger work. DB-backed routes will error until it's up.
    try {
      await this.$connect();
      this.logger.log('Connected to the database.');
    } catch (error) {
      this.logger.warn(
        `Database connection failed — continuing without DB. ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
