# Sistema de Controle de Estoque

Base inicial de um sistema interno para controle de estoque de três empresas.

## Tecnologias
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL

## Como rodar o projeto localmente

### Pré-requisitos
- Node.js 18+
- Yarn ou npm
- PostgreSQL

### Backend
1. Acesse a pasta `backend`.
2. Instale as dependências:
   ```sh
   npm install
   ```
3. Configure o banco de dados em `.env`.
4. Rode as migrations:
   ```sh
   npx prisma migrate dev
   ```
5. Inicie o servidor:
   ```sh
   npm run dev
   ```

### Frontend
1. Acesse a pasta `frontend`.
2. Instale as dependências:
   ```sh
   npm install
   ```
3. Inicie o projeto:
   ```sh
   npm run dev
   ```

---

- Paleta de cores: #ffffff, #6ad0f8, #000000
- Tipografia: Inter ou Roboto
- Ícones: Lucide ou HeroIcons
