## 📌 Projeto

Micro SaaS de agendamento online (foco inicial: profissionais autônomos, ex: barbearias)

Stack principal:

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Backend dentro do próprio Next.js (API Routes / Route Handlers)
- Banco: (futuro) Supabase / PostgreSQL

---

## 🎯 Objetivo do Projeto

Criar um sistema simples, rápido e funcional que permita:

- Cadastro de serviços
- Gestão de agenda
- Link público para agendamento
- Criação de agendamentos por clientes

Foco em:

- simplicidade
- performance
- mobile-first
- código limpo e escalável

---

## 🧠 Diretrizes de Desenvolvimento

- Sempre priorizar soluções simples
- Evitar overengineering
- Criar código reutilizável
- Seguir boas práticas de arquitetura
- Manter separação clara entre:
- UI
- lógica de negócio
- acesso a dados

---

## 🧪 Testes (OBRIGATÓRIO)

Testes são essenciais para garantir estabilidade do sistema.

### Ferramentas:

- Vitest
- Supertest

### Regras:

- Toda rota de API deve ter testes
- Testar:
- sucesso (200)
- erros (400, 404, 500)
- Testar regras de negócio (ex: evitar conflito de horários)
- Testes devem ser rápidos e independentes

### Exemplo de escopo:

- criação de agendamento
- validação de horário disponível
- validação de dados de entrada

---

## 🧹 Qualidade de Código

### ESLint (OBRIGATÓRIO)

- Garantir padrões consistentes
- Evitar erros comuns
- Rodar lint antes de commits

---

### Prettier (OBRIGATÓRIO)

- Padronizar formatação
- Evitar diffs desnecessários
- Configuração consistente (sem ponto e vírgula, aspas duplas, etc.)

---

## 🏗️ Build

- O projeto deve sempre buildar sem erros
- Nenhum warning crítico deve ser ignorado
- Validar build antes de deploy

---

## 🧾 Commits (OBRIGATÓRIO)

Commits devem ser **semânticos** seguindo **Conventional Commits**.

Formato:

`<tipo>(escopo opcional): <mensagem>`

Tipos recomendados:

- feat: nova feature
- fix: correção de bug
- test: testes
- chore: tarefas gerais/config
- docs: documentação
- refactor: refatoração sem mudança de comportamento
- perf: melhoria de performance
- ci: pipeline/automação

Regras:

- Mensagem curta e objetiva (sem ponto final)
- Preferir escopo quando fizer sentido (ex: `test(api): ...`, `chore(prettier): ...`)
- Não fazer commit “ruído” (ex: só whitespace) sem justificativa

---

## 📁 Estrutura (diretriz inicial)

```

/app
/api
/dashboard
/agenda
/services
/public

/lib
/utils
/services
/db

/tests

```

---

## ⚙️ Boas práticas

- Nomear variáveis de forma clara
- Evitar funções muito grandes
- Criar abstrações quando necessário
- Sempre validar dados de entrada (ex: Zod)

---

## 🚀 Prioridade de Desenvolvimento

1. Sistema de agendamento (core)
2. Página pública de agendamento
3. Dashboard simples
4. Melhorias e automações

---

## ❗ Regras importantes

- Não implementar features desnecessárias no MVP
- Não ignorar testes
- Não commitar código sem lint/format
- Não quebrar build

---

## 💡 Filosofia

> Feito é melhor que perfeito — mas funcional, testado e organizado.
