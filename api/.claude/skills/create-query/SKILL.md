---
name: create-query
description: Cria a camada Query seguindo a arquitetura Clean Architecture + CQRS Leve do projeto. Responsável pela leitura de dados, joins, projeções e validação de existência. Use ao criar uma nova Query, revisar uma existente ou quando precisar implementar uma operação de leitura.
when_to_use: >
  Acionar quando o usuário pedir para criar uma query, buscar dados, listar registros,
  criar xxx.query.ts, ou quando mencionar find, get, list, search no contexto de um módulo NestJS.
  Também acionar ao revisar se uma Query está correta ou violando regras arquiteturais.
  Acionar ao implementar leitura de entidade, detalhe, listagem ou verificação de existência.
allowed-tools: Read Glob Grep Write Edit
---

# Skill: Criar Query

Você está criando a **camada Query** deste projeto NestJS + Prisma.

> Leia o template com os padrões reais do projeto: [template.md](template.md)

---

## Regra de ouro

> **Query lê. Apenas lê.**

- Exclusivamente para leitura de dados
- Realiza joins, includes e projeções
- Valida existência e lança `NotFoundException`
- Recebe contexto por parâmetro — nunca resolve sozinha
- Chama apenas Repository — nunca acessa Prisma diretamente
- Sem efeito colateral de nenhum tipo

---

## Fluxo oficial (imutável)

```
Controller → Facade → Query → Repository → Prisma
```

A Query é a **visão de leitura** entre orquestração e persistência.

---

## Antes de criar: perguntas obrigatórias

1. **Qual módulo?** → A Query pertence exclusivamente a esse módulo
2. **Qual intenção de leitura?** → Uma única consulta clara: detalhe, listagem, busca, verificação
3. **Qual o nome correto?** → Deve começar com verbo de leitura: `FindXxx`, `ListXxx`, `GetXxx`
4. **Quais parâmetros?** → Liste tudo que precisa receber: `accountId`, `uuid`, `filtros`, `paginação`
5. **Precisa de include/join?** → Defina quais relações precisam ser carregadas
6. **Retorna `null` ou lança exceção?** → Se o dado deve existir, lance `NotFoundException`

---

## Regras de dependências

**Permitido:**
```
Facade → Query
Query  → Repository
```

**Proibido:**
```
Controller → Query          ← viola arquitetura
Query      → PrismaService  ← viola arquitetura
Query      → Command        ← viola separação CQRS
Query      → Facade         ← dependência circular
Query      → Repository de outro módulo
```

---

## Estrutura de pastas

```
src/modules/
└── nome-modulo/
    └── queries/
        ├── find-xxx-by-uuid.query.ts
        ├── find-xxx-by-account.query.ts
        └── list-xxx.query.ts
```

Cada arquivo representa **uma única intenção de leitura**.

---

## Convenções de nomenclatura

| Item     | Padrão                           | Exemplo                              |
|----------|----------------------------------|--------------------------------------|
| Classe   | `VerbXxxQuery`                   | `FindPostByUuidQuery`                |
| Arquivo  | `verb-xxx.query.ts`              | `find-post-by-uuid.query.ts`         |
| Método   | `execute(...params)`             | `execute(uuid, accountId)`           |

**Verbos obrigatórios:** `Find`, `Get`, `List`, `Search`, `Count`

---

## Padrões do projeto

### FindByUuid — busca por UUID com NotFoundException
```typescript
async execute(uuid: string): Promise<model_name> {
  const record = await this.repository.findByUuid(uuid);
  if (!record || record.is_deleted) {
    throw new NotFoundException('Registro não encontrado.');
  }
  return record;
}
```

### FindByAccount — busca por conta, retorna null se não existir
```typescript
async execute(accountId: number): Promise<model_name | null> {
  return this.repository.findByAccountId(accountId);
}
```

### ListByAccount — listagem com filtros opcionais
```typescript
async execute(accountId: number, filters?: ListXxxFiltersDto): Promise<model_name[]> {
  return this.repository.findManyByAccountId(accountId, filters);
}
```

### ListPaginated — listagem paginada
```typescript
async execute(
  accountId: number,
  page: number,
  limit: number,
): Promise<{ data: model_name[]; total: number }> {
  return this.repository.findManyPaginated(accountId, page, limit);
}
```

---

## O que a Query pode fazer

- Chamar métodos de leitura do Repository (`find*`, `list*`, `count*`)
- Lançar `NotFoundException` quando dado deve existir e não foi encontrado
- Validar soft delete (`is_deleted`) antes de retornar
- Receber e repassar filtros, paginação e ordenação ao Repository
- Retornar o tipo Prisma diretamente ou um DTO de leitura

## O que a Query NÃO pode fazer

- Acessar `PrismaService` diretamente
- Chamar `create`, `update`, `delete` — nem no Repository
- Chamar Command ou Facade
- Acessar Repository de outro módulo
- Resolver contexto de usuário por conta própria (receber por parâmetro)
- Lançar exceções de regra de negócio (`ConflictException`, `ForbiddenException`)
- Controlar transações

---

## Queries entre módulos

Quando outro módulo precisa de dados deste módulo, **exporte a Query**, nunca o Repository:

```typescript
// módulo A exporta a Query
@Module({
  providers: [XxxRepository, FindXxxByUuidQuery, XxxFacade],
  exports: [XxxFacade, FindXxxByUuidQuery],  // ← exportar Query para uso externo
})

// módulo B consome a Query
@Module({
  imports: [forwardRef(() => XxxModule)],
  providers: [
    YyyRepository,
    // injeta a Query do módulo A
  ],
})
```

---

## Registro no Module

Após criar a Query, registrá-la no module do módulo:

```typescript
@Module({
  imports: [CurrentUserModule],
  controllers: [XxxController],
  providers: [
    XxxRepository,
    FindXxxByUuidQuery,   // ← adicionar aqui
    ListXxxQuery,         // ← adicionar aqui
    CreateXxxCommand,
    UpdateXxxCommand,
    DeleteXxxCommand,
    XxxFacade,
  ],
  exports: [XxxFacade],
})
```

---

## Checklist de validação

Antes de finalizar, confirme:

- [ ] Nome começa com verbo de leitura (`Find`, `Get`, `List`, `Search`, `Count`)
- [ ] Arquivo termina com `.query.ts`
- [ ] Decorado com `@Injectable()`
- [ ] `Logger` inicializado com `Logger(XxxQuery.name)`
- [ ] Recebe todo contexto por parâmetro (nunca resolve `accountId` ou `userId` sozinha)
- [ ] Injeta apenas Repository do próprio módulo
- [ ] Não importa `PrismaService`
- [ ] Não importa nenhum Command
- [ ] Não importa Facade
- [ ] Não altera estado em nenhuma circunstância
- [ ] Lança `NotFoundException` quando o dado deve existir e não foi encontrado
- [ ] Valida `is_deleted` antes de retornar (quando aplicável)
- [ ] Registrada como `provider` no module
- [ ] Textos de exceção em português brasileiro correto

---

## Referências do projeto

- Exemplos reais: `src/modules/posts/queries/`
- Exemplos reais: `src/modules/brands/queries/`
