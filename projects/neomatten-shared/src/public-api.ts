/*
 * Public API Surface of neomatten-shared
 *
 * Shared wire-contract DTOs used by the Angular admin app, the main site and the
 * NestJS backend. Mirrors the Prisma models so one type travels FE ⇄ API ⇄ DB.
 */

export * from './lib/models/user.dto';
export * from './lib/models/order.dto';
export * from './lib/models/cart-item.dto';
export * from './lib/models/product.dto';
export * from './lib/models/media.dto';
