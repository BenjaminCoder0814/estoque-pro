# Deploy do backend SIZ no Render.com

## 1. Pré-requisitos (já estão prontos)

- ✅ Repo no GitHub: `BenjaminCoder0814/zenith-site`
- ✅ Banco Neon Postgres criado e populado
- ✅ `render.yaml` na raiz do repo
- ✅ `package.json` com scripts `build` e `start` + `postinstall` do Prisma
- ✅ Healthcheck em `/health`

## 2. Trocar a senha do Neon (URGENTE — está exposta)

1. Entre em https://console.neon.tech
2. Projeto → **Settings** → **Reset password** (do role `neondb_owner`)
3. Copie a nova `DATABASE_URL` (com `?sslmode=require` no final)
4. Atualize o `.env` local antes de continuar

## 3. Subir as mudanças pro GitHub

```powershell
Set-Location "C:\Users\User\Downloads\Site Zenith"
git add render.yaml "Sistema estoque/backend/package.json" "Sistema estoque/backend/render.yaml" "Sistema estoque/backend/.gitignore" "Sistema estoque/backend/prisma"
git commit -m "feat(siz): deploy backend para Render com Neon Postgres"
git push origin main
```

> ⚠️ Confirme que `Sistema estoque/backend/.env` NÃO está sendo commitado (está no `.gitignore`).

## 4. Criar o serviço no Render

1. Acesse https://dashboard.render.com → **New +** → **Blueprint**
2. Conecte sua conta do GitHub e selecione o repo `BenjaminCoder0814/zenith-site`
3. O Render lê o `render.yaml` e detecta o serviço `zenith-siz-backend`
4. Clique em **Apply**
5. Configure as variáveis de ambiente que ficaram com `sync: false`:
   - `DATABASE_URL` → cole a URL nova do Neon
   - `JWT_SECRET` → use algo longo e aleatório (ex: `openssl rand -base64 48`)
   - `CORS_ORIGIN` → `https://zenithlacres.com.br,https://www.zenithlacres.com.br,http://localhost:5173,http://localhost:8080`

## 5. Aguardar build e testar

- Build leva ~3-5 min na primeira vez
- URL final: `https://zenith-siz-backend.onrender.com`
- Teste: abra `https://zenith-siz-backend.onrender.com/health` → deve retornar `{"ok":true,"db":"up"}`

## 6. Apontar o frontend pro backend de produção

No `Sistema estoque/frontend/.env.local` (e onde o frontend rodar):

```env
VITE_API_URL=https://zenith-siz-backend.onrender.com
```

Rebuild:

```powershell
Set-Location "C:\Users\User\Downloads\Site Zenith\Sistema estoque\frontend"
npm run build
```

Se você sobe o frontend pro Hostinger, copie a pasta `dist/` pra dentro do `public_html_extracted/estoque/` ou onde estiver hospedado.

## 7. Observações sobre o plano free do Render

- **Cold start**: o serviço dorme após ~15 min sem requisições. Próxima request demora ~30s pra responder.
- **Solução simples**: deixar o polling do frontend rodando mantém o serviço acordado durante o expediente.
- **750h grátis/mês**: suficiente para 1 serviço sempre ligado.
- Quando o Render dormir e alguém abrir o SIZ, o badge "Ao vivo" vai mostrar "Offline" por uns 30s até o backend acordar — isso é normal.

## 8. Resumo dos arquivos criados/alterados

- `render.yaml` (raiz) — Blueprint do Render
- `Sistema estoque/backend/package.json` — scripts `build`, `postinstall`, `engines.node`
- `Sistema estoque/backend/.gitignore` — protege `.env` e `node_modules`
- `Sistema estoque/backend/prisma/schema.prisma` — provider postgresql
- `Sistema estoque/backend/prisma/migrations/20260513204756_init_postgres/` — migration inicial Neon
