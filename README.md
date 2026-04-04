## Agendo

Micro SaaS de agendamento online (foco inicial: profissionais autônomos como barbearias).

## Funcionalidades atuais

- Autenticação com email/senha e Google OAuth
- Recuperação de senha por email com verificação de link
- Dashboard com resumo diário e próximos atendimentos
- Agenda com bloqueios de horário reservado e ação rápida de WhatsApp
- Configurações de negócio e disponibilidade (dias, horários, pausas)
- Página pública de agendamento por `slug`
- Gestão de serviços com:
  - criação
  - edição por modal ao clicar no item
  - remoção em lote com confirmação
- Telemetria básica via Vercel Analytics
- Rate limit básico em login e solicitação de recuperação de senha

## Páginas principais

- `/` Página inicial
- `/login` Login
- `/cadastro` Cadastro de usuário
- `/esqueci-senha` Solicitar redefinição de senha
- `/esqueci-senha/aguardando` Espera/verificação + definição de nova senha
- `/dashboard` Resumo da operação
- `/agenda` Agenda diária
- `/servicos` Cadastro/edição/remoção de serviços
- `/configuracoes` Dados do negócio + disponibilidade
- `/:slug` Página pública para clientes agendarem

## Stack

- Next.js 16 (App Router)
- TypeScript
- TailwindCSS
- MongoDB (Mongoose)
- Vitest + Supertest

## Variáveis de ambiente

Use `.env.local` baseado em `.env.example`:

```env
MONGODB_URI=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
APP_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# opcional para testar analytics fora de produção
ENABLE_ANALYTICS=0
```

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts úteis

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

## Qualidade e testes

- Testes de API em `tests/`
- Rotas em `app/api/**/route.ts`
- Commits no padrão Conventional Commits

## Deploy

Deploy recomendado: Vercel.
