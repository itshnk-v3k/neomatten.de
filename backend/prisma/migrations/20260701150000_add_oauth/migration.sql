-- Make local password optional (OAuth accounts have none) and add OAuth linkage.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN "facebookId" TEXT;
ALTER TABLE "users" ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'local';

CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");
