# Referência: Schema Prisma Modularizado

Exemplos reais extraídos dos módulos do projeto.

---

## Model completo — users (referência real)

```prisma
model users {
  id                         Int                @id @unique(map: "id_UNIQUE") @default(autoincrement()) @db.UnsignedInt
  uuid                       String             @unique(map: "uuid_UNIQUE") @db.Char(36)
  photo_file_id              Int?               @db.UnsignedInt
  name                       String             @db.VarChar(255)
  email                      String             @unique(map: "email_UNIQUE") @db.VarChar(255)
  password                   String             @db.VarChar(255)
  phone                      String?            @db.VarChar(15)
  email_verified_at          DateTime?          @db.DateTime(0)
  is_active                  Boolean            @default(true)
  is_deleted                 Boolean            @default(false)
  created_at                 DateTime           @default(now()) @db.Timestamp(0)
  updated_at                 DateTime           @default(now()) @db.Timestamp(0)
  deleted_at                 DateTime?          @db.Timestamp(0)
  account_users              account_users[]
  profile_photo              files?             @relation("users_profile", fields: [photo_file_id], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "fk_users_files1")

  @@index([photo_file_id], map: "fk_users_files1_idx")
  @@index([is_active, is_deleted], map: "users_active_deleted_idx")
}
```

---

## Model novo — template para novo módulo

```prisma
model nome_entidade {
  id         Int      @id @unique(map: "id_UNIQUE") @default(autoincrement()) @db.UnsignedInt
  uuid       String   @unique(map: "uuid_UNIQUE") @db.Char(36)
  account_id Int      @db.UnsignedInt
  title      String   @db.VarChar(255)
  content    String?  @db.Text
  is_active  Boolean  @default(true)
  is_deleted Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamp(0)
  updated_at DateTime @default(now()) @db.Timestamp(0)
  deleted_at DateTime? @db.Timestamp(0)

  accounts   accounts @relation(fields: [account_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_nome_entidade_accounts1")

  @@index([account_id], map: "fk_nome_entidade_accounts1_idx")
  @@index([is_active, is_deleted], map: "nome_entidade_active_deleted_idx")
}
```

---

## Relação 1:N (um account tem muitos registros)

```prisma
// No model filho — aponta para accounts
model publications {
  id         Int      @id @unique(map: "id_UNIQUE") @default(autoincrement()) @db.UnsignedInt
  uuid       String   @unique(map: "uuid_UNIQUE") @db.Char(36)
  account_id Int      @db.UnsignedInt

  accounts   accounts @relation(fields: [account_id], references: [id], onDelete: Cascade, map: "fk_posts_accounts1")

  @@index([account_id], map: "fk_posts_accounts1_idx")
}

// No model pai (accounts) — lista os filhos
model accounts {
  // ...
  publications posts[]
}
```

---

## Relação N:N (via tabela intermediária)

```prisma
model publications {
  id         Int          @id @default(autoincrement()) @db.UnsignedInt
  publication_tags  publication_tags[]
}

model tags {
  id         Int          @id @default(autoincrement()) @db.UnsignedInt
  publication_tags  publication_tags[]
}

model publication_tags {
  publication_id Int @db.UnsignedInt
  tag_id  Int @db.UnsignedInt
  publications   publications @relation(fields: [publication_id], references: [id], onDelete: Cascade, map: "fk_publication_tags_posts1")
  tags    tags  @relation(fields: [tag_id], references: [id], onDelete: Cascade, map: "fk_publication_tags_tags1")

  @@id([publication_id, tag_id])
  @@index([tag_id], map: "fk_publication_tags_tags1_idx")
}
```

---

## Campo JSON (para dados flexíveis)

```prisma
model brands {
  id       Int    @id @default(autoincrement()) @db.UnsignedInt
  metadata Json?  @db.Json
}
```

---

## Enum no schema do módulo

```prisma
enum publication_status {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}

model publications {
  id     Int         @id @default(autoincrement()) @db.UnsignedInt
  status publication_status @default(DRAFT)
}
```

---

## Fluxo completo — criando um novo módulo com schema

### 1. Criar o arquivo `.prisma` do módulo
```
src/modules/posts/prisma/posts.prisma
```

### 2. Conteúdo mínimo do arquivo
```prisma
model publications {
  id         Int      @id @unique(map: "id_UNIQUE") @default(autoincrement()) @db.UnsignedInt
  uuid       String   @unique(map: "uuid_UNIQUE") @db.Char(36)
  account_id Int      @db.UnsignedInt
  title      String   @db.VarChar(255)
  is_active  Boolean  @default(true)
  is_deleted Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamp(0)
  updated_at DateTime @default(now()) @db.Timestamp(0)
  deleted_at DateTime? @db.Timestamp(0)

  accounts   accounts @relation(fields: [account_id], references: [id], onDelete: Cascade, map: "fk_posts_accounts1")

  @@index([account_id], map: "fk_posts_accounts1_idx")
}
```

### 3. Comandos na ordem certa
```bash
pnpm prisma:migrate    # build + cria a migration
pnpm prisma:generate   # build + regenera o client
```

### 4. Verificar o resultado
```bash
# O schema gerado deve conter o novo model
grep -n "model posts" prisma/schema.prisma
```

---

## Tipos de dados MariaDB mais usados

| Dado             | Tipo Prisma              | Anotação                  |
|------------------|--------------------------|---------------------------|
| ID primário      | `Int`                    | `@db.UnsignedInt`         |
| UUID             | `String`                 | `@db.Char(36)`            |
| Texto curto      | `String`                 | `@db.VarChar(255)`        |
| Texto longo      | `String`                 | `@db.Text`                |
| Booleano         | `Boolean`                | —                         |
| Data e hora      | `DateTime`               | `@db.Timestamp(0)`        |
| Data e hora      | `DateTime`               | `@db.DateTime(0)`         |
| Número decimal   | `Decimal`                | `@db.Decimal(15, 2)`      |
| Inteiro grande   | `BigInt`                 | `@db.BigInt`              |
| JSON             | `Json`                   | `@db.Json`                |
| FK (referência)  | `Int`                    | `@db.UnsignedInt`         |

---

## Erros comuns e soluções

### Erro: model não existe no Client após adicionar ao `.prisma`
**Causa:** `prisma generate` não foi rodado após o build.
**Solução:** `pnpm prisma:generate`

### Erro: campo `account_id` does not exist in type
**Causa:** Usar campo direto no Command ao invés de relação Prisma.
**Solução:** `{ accounts: { connect: { id: accountId } } }`

### Erro: alteração não aparece na migration
**Causa:** Schema editado diretamente em `prisma/schema.prisma` (que foi sobrescrito).
**Solução:** Editar sempre `src/modules/[modulo]/prisma/[modulo].prisma` e rodar `pnpm prisma:migrate`

### Erro: `generator` ou `datasource` duplicado
**Causa:** Arquivo `.prisma` do módulo contém bloco `generator` ou `datasource`.
**Solução:** Remover — esses blocos existem apenas em `prisma/base.prisma`
