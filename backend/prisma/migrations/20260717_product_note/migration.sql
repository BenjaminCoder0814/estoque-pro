-- AddColumn: note (observacao do produto)
-- Antes desta coluna a observacao vivia apenas no localStorage de cada navegador,
-- entao o que a expedicao escrevia nunca chegava ao comercial.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "note" TEXT NOT NULL DEFAULT '';
