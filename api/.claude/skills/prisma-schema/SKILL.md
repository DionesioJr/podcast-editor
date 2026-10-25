---
name: prisma-schema
description: Explica e guia o uso do schema Prisma modularizado deste projeto. Cada módulo tem seu próprio arquivo .prisma que é compilado automaticamente no schema.prisma da raiz. Use ao criar, editar ou entender modelos Prisma, rodar migrations, gerar o client ou adicionar um novo módulo ao schema.
when_to_use: >
  Acionar ao criar ou editar um model Prisma, adicionar campo a uma tabela, criar relação entre modelos,
  rodar migration, gerar o Prisma Client, entender por que uma alteração de schema não surtiu efeito,
  ou ao perguntar onde editar o schema de um módulo.
  Acionar ao mencionar schema.prisma, prisma migrate, prisma generate, prisma:build, model Prisma ou
  qualquer operação de banco de dados estrutural.
allowed-tools: Read Glob Grep Write Edit Bash
---

# Skill: Schema Prisma Modularizado

Este projeto usa **schema Prisma modularizado**. Cada módulo define seus próprios models em um arquivo `.prisma` separado. Um script de build concatena todos esses arquivos e gera o `prisma/schema.prisma` final antes de qualquer operação Prisma.

> Leia o guia de referência com exemplos reais: [reference.md](reference.md)

---

## Regra de ouro

> **Nunca edite `prisma/schema.prisma` diretamente.**

Esse arquivo é **gerado automaticamente**. Qualquer edição manual será sobrescrita na próxima vez que `pnpm prisma:build` for executado.

---

## Como funciona o build

O script `prisma/build-prisma.ts` executa o seguinte fluxo:

```
1. Lê prisma/base.prisma          ← configuração do generator e datasource
2. Busca todos os arquivos em      src/modules/**/prisma/*.prisma
3. Concatena tudo em ordem
4. Grava o resultado em            prisma/schema.prisma  ← arquivo gerado
```

**Código do build (`prisma/build-prisma.ts`):**
```typescript
const baseSchema = fs.readFileSync('prisma/base.prisma', 'utf8');
const storages = globSync('src/modules/**/prisma/*.prisma');

let schema = baseSchema;
for (const file of files) {
  schema += '\n\n' + fs.readFileSync(file, 'utf8');
}

fs.writeFileSync('prisma/schema.prisma', schema);
```

**`prisma/base.prisma` (nunca editar):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

---

## Onde fica o schema de cada módulo

```
src/modules/
├── users/
│   └── prisma/
│       └── users.prisma          ← models do módulo users
├── accounts/
│   └── prisma/
│       └── accounts.prisma       ← models do módulo accounts
├── subscriptions/
│   └── prisma/
│       └── subscriptions.prisma
├── files/
│   └── prisma/
│       └── files.prisma
└── [novo-modulo]/
    └── prisma/
        └── [novo-modulo].prisma  ← criar aqui ao adicionar módulo
```

**Módulos com schema ativos hoje:**
- `src/modules/auth/prisma/auth.prisma`
- `src/modules/users/prisma/users.prisma`
- `src/modules/accounts/prisma/accounts.prisma`
- `src/modules/files/prisma/files.prisma`
- `src/modules/subscriptions/prisma/subscriptions.prisma`
- `src/modules/notifications/prisma/notifications.prisma`
- `src/modules/notifications-controls/prisma/notifications-controls.prisma`
- `src/modules/notifications-cron/prisma/notifications-cron.prisma`
- `src/modules/api-keys/prisma/api-keys.prisma`
- `src/modules/file-processing/prisma/file-processing.prisma`

---

## Comandos disponíveis (via package.json)

| Comando                  | O que faz                                                    |
|--------------------------|--------------------------------------------------------------|
| `pnpm prisma:build`      | Concatena os schemas dos módulos → gera `prisma/schema.prisma` |
| `pnpm prisma:generate`   | Executa o build + `prisma generate` (atualiza o Client)     |
| `pnpm prisma:migrate`    | Executa o build + `prisma migrate dev` (cria migration)     |
| `pnpm prisma:deploy`     | Executa o build + `prisma migrate deploy` (aplica em prod)  |
| `pnpm db:seed`           | Roda os seeds de configuração                               |
| `pnpm db:seed:config`    | Roda apenas seeds de configuração base                      |
| `pnpm db:reset`          | Build + generate + reset + push + seed (ambiente local)     |

**Todos os comandos Prisma já incluem o build automaticamente.**
Nunca rode `prisma generate` ou `prisma migrate` diretamente sem passar pelo script.

---

## Fluxo ao adicionar ou alterar um model

### Alterar model existente
```
1. Edite  src/modules/[modulo]/prisma/[modulo].prisma
2. Execute pnpm prisma:migrate        ← build + migration dev
3. Execute pnpm prisma:generate       ← garante client atualizado
```

### Criar model em módulo novo
```
1. Crie a pasta  src/modules/[novo-modulo]/prisma/
2. Crie o arquivo [novo-modulo].prisma  com os models
3. Execute pnpm prisma:migrate
4. Execute pnpm prisma:generate
```

---

## Padrões obrigatórios dos models

Todo model deste projeto segue as convenções abaixo:

### Campos obrigatórios
```prisma
model nome_da_entidade {
  id         Int       @id @unique @default(autoincrement()) @db.UnsignedInt
  uuid       String    @unique @db.Char(36)
  is_active  Boolean   @default(true)
  is_deleted Boolean   @default(false)
  created_at DateTime  @default(now()) @db.Timestamp(0)
  updated_at DateTime  @default(now()) @db.Timestamp(0)
  deleted_at DateTime? @db.Timestamp(0)
}
```

### Relação com accounts (padrão de posse)
```prisma
model publications {
  // ...campos
  account_id Int      @db.UnsignedInt
  accounts   accounts @relation(fields: [account_id], references: [id], onDelete: Cascade, map: "fk_posts_accounts1")

  @@index([account_id], map: "fk_posts_accounts1_idx")
}
```

### Banco de dados: MariaDB via MySQL provider
- Usar sempre `@db.UnsignedInt` para IDs e FKs
- Usar `@db.VarChar(255)` para strings curtas
- Usar `@db.Text` para strings longas
- Usar `@db.Timestamp(0)` para datas
- Usar `@db.Char(36)` para UUIDs
- **Nunca usar tipos PostgreSQL** (`@db.Uuid`, `@db.Text` de PG, etc.)

---

## Seeds

Os seeds ficam em `prisma/seeds/` e são executados com `PrismaClient` normal.

**Estrutura:**
```
prisma/seeds/
├── seed.ts                        ← entrypoint principal
└── config/
    ├── run-config-seeds.ts        ← orquestra seeds de config
    ├── system-account.seed.ts     ← conta de sistema
    ├── financial-institutions.seed.ts
    └── categories.seed.ts
```

**Para criar um novo seed:**
1. Crie o arquivo em `prisma/seeds/config/seu-seed.seed.ts`
2. Importe e chame em `run-config-seeds.ts`

---

## Anti-patterns (PROIBIDO)

- Editar `prisma/schema.prisma` diretamente
- Criar models fora de `src/modules/[modulo]/prisma/`
- Rodar `prisma generate` sem passar por `pnpm prisma:generate`
- Rodar `prisma migrate dev` sem passar por `pnpm prisma:migrate`
- Usar tipos de banco incompatíveis com MariaDB/MySQL
- Colocar `generator` ou `datasource` no schema do módulo (só vai em `base.prisma`)

---

## Checklist ao criar ou alterar schema

- [ ] Editou o arquivo `.prisma` do módulo, nunca o `prisma/schema.prisma`
- [ ] O arquivo está em `src/modules/[modulo]/prisma/`
- [ ] Todos os models têm `id`, `uuid`, `is_active`, `is_deleted`, `created_at`, `updated_at`
- [ ] FKs usam `@db.UnsignedInt` e têm `@@index` correspondente
- [ ] Usou `pnpm prisma:migrate` (não `prisma migrate dev` diretamente)
- [ ] Usou `pnpm prisma:generate` após a migration
- [ ] Nomes de tabelas e campos em `snake_case`
- [ ] Sem `generator` ou `datasource` no arquivo do módulo
