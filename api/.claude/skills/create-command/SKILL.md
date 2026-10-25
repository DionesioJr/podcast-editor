---
name: create-command
description: Cria a camada Command seguindo a arquitetura Clean Architecture + CQRS Leve do projeto. Responsável por executar uma intenção de negócio, alterar estado do sistema e aplicar regras de domínio. Use ao criar um novo Command, revisar um existente ou quando precisar implementar uma operação de escrita.
when_to_use: >
  Acionar quando o usuário pedir para criar um command, implementar operação de escrita,
  criar xxx.command.ts, ou quando mencionar criar, atualizar, deletar, ativar ou desativar
  uma entidade no contexto de um módulo NestJS.
  Também acionar ao revisar se um Command está correto ou violando regras arquiteturais.
allowed-tools: Read Glob Grep Write Edit
---

# Skill: Criar Command

Você está criando a **camada Command** deste projeto NestJS + Prisma.

> Leia o template com os padrões reais do projeto: [template.md](template.md)

---

## Regra de ouro

> **Command muda estado. Apenas isso.**

- Uma intenção de negócio por Command
- Aplica regras de negócio e validações de domínio
- Recebe contexto por parâmetro — nunca resolve sozinho
- Escreve via Repository — nunca acessa Prisma diretamente
- Não chama Query, Facade nem outro módulo's Repository

---

## Fluxo oficial (imutável)

```
Controller → Facade → Command → Repository → Prisma
```

O Command é o **executor de intenção** entre orquestração e persistência.

---

## Antes de criar: perguntas obrigatórias

1. **Qual módulo?** → O Command pertence exclusivamente a esse módulo
2. **Qual intenção?** → Uma única ação clara: criar, atualizar, deletar, ativar, desativar
3. **Qual o nome correto?** → Deve começar com verbo de ação: `CreateXxx`, `UpdateXxx`, `DeleteXxx`
4. **Quais parâmetros?** → Liste tudo que precisa receber: `accountId`, `userId`, `dto`, etc.
5. **Quais validações de negócio?** → Conflitos, pré-condições, estado mínimo necessário
6. **Precisa de UUID?** → Entidades novas geralmente precisam de `uuidv4()`

---

## Regras de dependências

**Permitido:**
```
Facade  → Command
Command → Repository
```

**Proibido:**
```
Controller  → Command       ← viola arquitetura
Command     → PrismaService ← viola arquitetura
Command     → Query         ← viola separação CQRS
Command     → Facade        ← dependência circular
Command     → Repository de outro módulo
```

---

## Estrutura de pastas

```
src/modules/
└── nome-modulo/
    └── commands/
        ├── create-xxx.command.ts
        ├── update-xxx.command.ts
        └── delete-xxx.command.ts
```

Cada arquivo representa **uma única intenção de negócio**.

---

## Convenções de nomenclatura

| Item     | Padrão                           | Exemplo                         |
|----------|----------------------------------|---------------------------------|
| Classe   | `VerbXxxCommand`                 | `CreatePostCommand`             |
| Arquivo  | `verb-xxx.command.ts`            | `create-post.command.ts`        |
| Método   | `execute(...params)`             | `execute(accountId, dto)`       |

**Verbos obrigatórios:** `Create`, `Update`, `Delete`, `Activate`, `Deactivate`, `Publish`, `Archive`

---

## Padrões do projeto

### Create — entidade nova com UUID
```typescript
async execute(accountId: number, dto: CreateXxxDto): Promise<model_name> {
  // 1. Validar pré-condição de negócio (se houver)
  const existing = await this.repository.findByAccountId(accountId);
  if (existing) {
    throw new ConflictException('Registro já existe para esta conta.');
  }

  // 2. Criar via Repository usando relação Prisma
  return this.repository.create({
    uuid: uuidv4(),
    accounts: { connect: { id: accountId } },
    field1: dto.field1,
    is_active: true,
    is_deleted: false,
  });
}
```

### Update — alterar estado de entidade existente
```typescript
async execute(uuid: string, dto: UpdateXxxDto): Promise<model_name> {
  // 1. Validar que a entidade existe e pode ser alterada
  const record = await this.repository.findByUuid(uuid);
  if (!record) {
    throw new NotFoundException('Registro não encontrado.');
  }
  if (record.is_deleted) {
    throw new UnprocessableEntityException('Registro foi removido e não pode ser editado.');
  }

  // 2. Atualizar via Repository
  return this.repository.update(uuid, {
    field1: dto.field1,
    updated_at: new Date(),
  });
}
```

### Delete — soft delete
```typescript
async execute(uuid: string): Promise<model_name> {
  const record = await this.repository.findByUuid(uuid);
  if (!record) {
    throw new NotFoundException('Registro não encontrado.');
  }

  return this.repository.delete(uuid);
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

## O que o Command pode fazer

- Validar regras de negócio (conflitos, pré-condições, estado mínimo)
- Lançar `NotFoundException`, `ConflictException`, `UnprocessableEntityException`
- Chamar métodos de leitura simples no Repository para validação de pré-condição
- Gerar UUID com `uuidv4()` para entidades novas
- Definir valores padrão (`is_active`, `is_deleted`, `created_at`)
- Emitir eventos de domínio (se aplicável)

## O que o Command NÃO pode fazer

- Acessar `PrismaService` diretamente
- Chamar Query Service
- Chamar Facade
- Acessar Repository de outro módulo
- Fazer joins ou projeções complexas
- Retornar DTOs de leitura para UI
- Controlar transações globais
- Resolver contexto de usuário por conta própria

---

## Registro no Module

Após criar o Command, registrá-lo no module do módulo:

```typescript
@Module({
  providers: [
    NomeModuloRepository,
    CreateXxxCommand,   // ← adicionar aqui
    UpdateXxxCommand,   // ← adicionar aqui
    DeleteXxxCommand,   // ← adicionar aqui
    NomeModuloFacade,
  ],
  exports: [NomeModuloFacade],
  // Commands só são exportados quando outro módulo precisa consumir essa intenção
})
```

---

## Checklist de validação

Antes de finalizar, confirme:

- [ ] Nome começa com verbo de ação (`Create`, `Update`, `Delete`, `Activate`...)
- [ ] Arquivo termina com `.command.ts`
- [ ] Decorado com `@Injectable()`
- [ ] `Logger` inicializado com `Logger(XxxCommand.name)`
- [ ] Recebe todo contexto por parâmetro (nunca resolve `accountId` ou `userId` sozinho)
- [ ] Injeta apenas Repository do próprio módulo
- [ ] Não importa `PrismaService`
- [ ] Não importa nenhuma Query
- [ ] Não importa Facade
- [ ] Relações via `connect` (não campo `_id` direto)
- [ ] Uma única intenção por Command
- [ ] Registrado como `provider` no module
- [ ] Textos de exceção em português brasileiro correto

---

## Referências do projeto

- Exemplos reais: `src/modules/posts/commands/`
- Exemplos reais: `src/modules/brands/commands/`
