-- AddColumn: avatarUrl (foto de perfil escolhida pelo usuario)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT NOT NULL DEFAULT '';
