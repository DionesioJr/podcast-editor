# CLAUDE.md (api)

Backend NestJS com Prisma ORM do Podcast Editor. API HTTP e worker são o mesmo código, iniciados por `main.ts` e `worker.ts`.

## Banco de dados

**MariaDB** via Prisma (provider `mysql`, variável `DATABASE_URL`). Não use PostgreSQL, SQLite nem outro banco. A fila de jobs também vive no banco.

## Arquitetura

Clean Architecture com CQRS leve, como no pust/api. Fluxo oficial: **Controller, Facade, Query e Command**, com **Repository** atrás de interface e token de injeção de dependência. Nenhum caso de uso acessa Prisma direto.

Consulte as skills em `.claude/skills/` antes de criar ou alterar código: `architecture`, `create-facade`, `create-query`, `create-command`, `create-repository` e `prisma-schema`. Respeite as regras de dependência entre camadas.

```
src/modules/[modulo]/
├── [modulo].controller.ts
├── [modulo].module.ts
├── facades/
├── queries/
├── commands/
├── repositories/
├── dto/
└── prisma/[modulo].prisma
```

## Schema Prisma modular

Cada módulo tem o seu schema em `src/modules/[modulo]/prisma/[modulo].prisma`, compilado no `schema.prisma` da raiz. Nunca edite o `schema.prisma` da raiz à mão.

## Regras

- Mensagens de exceção, de log e de validação em português do Brasil correto, com acentuação.
- Toda alteração em `*.controller.ts` ou em `dto/*.ts` atualiza o documento `docs/API - [Modulo].md` na mesma tarefa.
- Nunca crie arquivos `index.ts`.
- Regras de negócio e cálculos (timeline, cortes, legendas, durações) ficam na API, em funções puras e testáveis.
- Documentação da API com `@nestjs/swagger`, citando em cada rota a regra que ela implementa (RN, RP, RC).
- Tempos sempre em milissegundos inteiros, na linha do tempo do vídeo original.
- Logs nunca guardam token do projeto, texto de transcrição nem nome de arquivo.
