/**
 * User / account profile — the wire contract shared with the NestJS backend
 * (`GET /api/users/:id`, auth endpoints). Maps to the Prisma `User` model.
 */
export interface UserDTO {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly isAdmin: boolean;
  /** ISO timestamp. */
  readonly createdAt: string;
  /** ISO timestamp. */
  readonly updatedAt: string;
}
