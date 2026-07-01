-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "category" TEXT,
    "value" TEXT NOT NULL,
    "draftValue" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translations_locale_idx" ON "translations"("locale");

-- CreateIndex
CREATE INDEX "translations_category_idx" ON "translations"("category");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_locale_key" ON "translations"("key", "locale");
