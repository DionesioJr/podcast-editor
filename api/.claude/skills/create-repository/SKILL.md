---
name: create-repository
description: Cria a camada Repository seguindo a arquitetura Clean Architecture + CQRS Leve do projeto. Responsável pela persistência e acesso ao banco via Prisma. Use ao criar um novo Repository, revisar um existente ou quando precisar entender as regras dessa camada.
when_to_use: >
  Acionar quando o usuário pedir para criar um repository, adicionar camada de persistência,
  implementar acesso ao banco, criar xxx.repository.ts, ou quando mencionar Repository no contexto
  de um módulo NestJS. Também acionar ao revisar se um Repository está correto ou violando regras.
allowed-tools: Read Glob Grep Write Edit
---

# Skill: Criar Repository

Você está criando a **camada Repository** deste projeto NestJS + Prisma.

> Leia o template com os padrões reais do projeto: [template.md](template.md)

---

## Regra de ouro

> **Repository fala com o banco. Apenas isso.**

- Única camada que acessa `PrismaService`
- Sem regras de negócio
- Sem contexto de usuário ou request
- Sem chamar Query, Command ou Facade
- Exclusivo do seu módulo — nunca compartilhado

---

## Fluxo oficial (imutável)

```
Controller → Facade → Query/Command → Repository → Prisma
```

O Repository é o **boundary** entre domínio e infraestrutura.

---

## Antes de criar: perguntas obrigatórias

1. **Qual módulo?** → O Repository pertence exclusivamente a esse módulo
2. **Qual modelo Prisma?** → Confirme o nome exato em `src/modules/[modulo]/prisma/schema.prisma`
3. **Quais operações?** → Liste leitura (find*) e escrita (create, update, delete) necessárias
4. **Usa soft delete?** → Padrão do projeto: `is_deleted: true + deleted_at`
5. **Precisa de transações?** → Aceitar `tx?: Prisma.TransactionClient` nos métodos

---

## Regras de dependências

**Permitido:**
```
Query      → Repository
Command    → Repository
Repository → PrismaService
```

**Proibido:**
```
Controller → Repository   ← viola arquitetura
Facade     → Repository   ← viola arquitetura
Repository → Facade       ← dependência circular
Repository → Query        ← viola arquitetura
Repository → Command      ← viola arquitetura
Repository de módulo A → Repository de módulo B
```

---

## Estrutura de pastas

```
src/modules/
└── nome-modulo/
    └── repositories/
        └── nome-modulo.repository.ts
```

Arquivo único por módulo. Interface opcional: `nome-modulo.repository.interface.ts`

---

## Convenções de nomenclatura

| Item     | Padrão                           | Exemplo                   |
|----------|----------------------------------|---------------------------|
| Classe   | `XxxRepository`                  | `PostsRepository`         |
| Arquivo  | `xxx.repository.ts`              | `posts.repository.ts`     |
| Métodos  | verbo + contexto                 | `findByUuid`, `create`    |

**Prefixos obrigatórios para leitura:** `find`, `get`, `list`, `check`, `count`  
**Prefixos obrigatórios para escrita:** `create`, `update`, `delete`, `upsert`

---

## Padrões do projeto

### Soft delete (padrão obrigatório para entidades principais)
```typescript
async delete(uuid: string): Promise<ModelName> {
  return this.prisma.model_name.update({
    where: { uuid },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
    },
  });
}
```

### Transações — método dedicado
```typescript
async createWithTransaction(
  data: Prisma.model_nameCreateInput,
  tx: Prisma.TransactionClient,
): Promise<ModelName> {
  return tx.model_name.create({ data });
}
```

### Transações — parâmetro opcional
```typescript
async update(
  uuid: string,
  data: Prisma.model_nameUpdateInput,
  tx?: Prisma.TransactionClient,
): Promise<ModelName> {
  const client = tx || this.prisma;
  return client.model_name.update({ where: { uuid }, data });
}
```

### Relações Prisma (nunca campo direto)
```typescript
// ERRADO — campo direto não existe no tipo Prisma
{ account_id: accountId }

// CORRETO — usar connect
{ accounts: { connect: { id: accountId } } }
```

---

## O que o Repository pode fazer

- `findUnique`, `findFirst`, `findMany` com `where`, `include`, `select`, `orderBy`
- `create`, `update`, `updateMany`, `delete`, `deleteMany`, `upsert`
- `$transaction` para atomicidade local
- Aceitar `Prisma.TransactionClient` para transações externas
- `count`, `aggregate` para consultas de métricas
- Lançar apenas erros técnicos (constraints, not found técnico)

## O que o Repository NÃO pode fazer

- Lançar `NotFoundException`, `ConflictException` de negócio
- Acessar `req`, `user`, sessão ou contexto de request
- Conter `if` de regra de negócio (ex: "se usuário tem plano X")
- Chamar outro Repository, Query, Command ou Facade
- Retornar DTOs de resposta da API (retornar tipos do Prisma)

---

## Registro no Module

Após criar o Repository, registrá-lo no module do módulo:

```typescript
@Module({
  providers: [
    NomeModuloRepository, // ← adicionar aqui
    // ... queries e commands
  ],
  // NÃO exportar Repository — exportar apenas Facade
})
```

---

## Checklist de validação

Antes de finalizar, confirme:

- [ ] Único arquivo no módulo que importa `PrismaService`
- [ ] Decorado com `@Injectable()`
- [ ] `Logger` inicializado com `Logger(XxxRepository.name)`
- [ ] Nenhum método conhece usuário logado ou contexto de request
- [ ] Soft delete implementado para entidades que precisam
- [ ] Métodos com transação aceitam `tx?: Prisma.TransactionClient`
- [ ] Relações via `connect` (não campo `_id` direto)
- [ ] Registrado como `provider` no module
- [ ] Não exportado no module (exportar apenas Facade)
- [ ] Textos em português brasileiro correto

---

## Referências do projeto
- Exemplos reais: `src/modules/users/repositories/users.repository.ts`
- Exemplos reais: `src/modules/accounts/repositories/accounts.repository.ts`
