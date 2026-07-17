-- AddColumns: displayName + displayNameSet
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayNameSet" BOOLEAN NOT NULL DEFAULT false;
