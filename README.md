## 📅 Agendo

Micro SaaS de **agendamento online** (foco inicial: profissionais autônomos, ex: barbearias).

### ✨ Objetivo (MVP)

- 🧾 Cadastro de serviços
- 🗓️ Gestão de agenda
- 🔗 Link público para agendamento
- ✅ Criação de agendamentos por clientes

### 🧰 Stack

- ⚡ Next.js (App Router)
- 🧠 TypeScript
- 🎨 TailwindCSS
- 🧩 Backend no próprio Next.js (Route Handlers)
- 🧪 Testes: Vitest + Supertest

### 🚀 Como rodar

Instale as dependências:

```bash
npm install
```

Rode o servidor:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

### ✅ Scripts úteis

```bash
# qualidade
npm run lint
npm run format
npm run format:check

# testes
npm test
npm run test:watch
npm run test:coverage

# build
npm run build
npm run start
```

### 🧪 Testes de API (App Router)

- 🧩 Testes ficam em `tests/`
- 🛣️ Rotas ficam em `app/api/**/route.ts`
- ❤️ Exemplo: `GET /api/health`

### 📁 Estrutura (visão geral)

```
app/
  api/
lib/
services/
utils/
tests/
```

### 📝 Padrões do projeto

- 🧹 Formatação: Prettier + EditorConfig (evita diffs só por quebra de linha)
- 🧾 Commits: Conventional Commits (semânticos)

## Getting Started

> Esta seção é o template padrão do Next.js. Podemos remover quando o projeto estiver mais avançado.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
