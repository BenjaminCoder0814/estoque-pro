# Backend Sistema de Estoque

## 1) Instalação

1. Copie `.env.example` para `.env` (PostgreSQL).
2. Instale dependências:
   npm install
3. Gere o client Prisma:
   npm run prisma:generate
4. Rode migração:
   npm run prisma:migrate -- --name init_pg
5. Rode seed:
   npm run prisma:seed

## 2) Subir API

npm run dev

API padrão: `http://localhost:3001`

## 3) Credenciais iniciais

- admin@zenith.local / admin123
- expedicao@zenith.local / 123456
- compras@zenith.local / 123456
- supervisao@zenith.local / 123456
- comercial@zenith.local / 123456
- producao@zenith.local / 123456
- visitante@zenith.local / 123456

## 4) Rotas

- GET /health
- POST /api/auth/login
- GET /api/auth/me
- GET/POST/PUT/DELETE /api/products
- GET /api/products/alerts
- GET/POST /api/movements
- GET/POST/PATCH /api/pending-orders
- GET/POST/DELETE /api/media
- GET/POST/PATCH/DELETE /api/users (somente ADMIN)
