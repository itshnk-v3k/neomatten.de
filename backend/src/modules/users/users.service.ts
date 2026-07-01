import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Fields accepted when creating a user (local or OAuth). */
interface CreateUserData {
  email: string;
  /** Null for OAuth-created accounts (no local password). */
  passwordHash?: string | null;
  firstName: string;
  lastName: string;
  phone?: string;
  googleId?: string;
  facebookId?: string;
  /** "local" | "google" | "facebook". Defaults to "local" in the schema. */
  authProvider?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  findByFacebookId(facebookId: string) {
    return this.prisma.user.findUnique({ where: { facebookId } });
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  /** Patch a user (used to link an OAuth provider id onto an existing account). */
  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }
}
