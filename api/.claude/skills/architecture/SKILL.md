---
name: architecture
description: Referência normativa da arquitetura Clean Architecture + CQRS Leve do projeto. Define o fluxo oficial, responsabilidades de cada camada, regras de dependência e convenções. Use ao criar ou modificar qualquer módulo, decidir onde colocar uma lógica, ou revisar conformidade arquitetural.
when_to_use: >
  Acionar ao criar módulo, controller, facade, query, command ou repository.
  Acionar ao decidir onde colocar uma regra de negócio, validação ou consulta ao banco.
  Acionar ao revisar se o código está na camada correta.
  Acionar ao perguntar "onde isso deve ficar?" ou "como estruturar esse módulo?".
allowed-tools: Read Glob Grep
---

# Arquitetura do Projeto

Este projeto segue **Clean Architecture com CQRS Leve**.
Este documento é **normativo** — não é sugestão, é regra.


---

## Fluxo oficial (imutável)

```
Controller
    ↓
Facade (Orchestrator)
    ↓──────────────────↓
Query Service        Command
    ↓
Repository
    ↓
Prisma (Infra)
```

Nenhuma camada pode pular outra. Nenhuma dependência sobe no fluxo.

---

## Regras de dependência

**Permitido:**
```
Controller  → Facade
Facade      → Query / Command
Query       → Repository
Command     → Repository
Repository  → PrismaService
```

**Proibido (quebra arquitetura):**
```
Controller → Repository
Controller → Query
Controller → Command
Facade     → Repository        ← acessar diretamente
Facade     → PrismaService
Query      → PrismaService
Query      → Command
Command    → PrismaService
Command    → Query
Command    → Facade
Repository → Query / Command / Facade
Módulo A   → Repository do Módulo B
```

---

## Responsabilidades por camada

### Controller
- Entrada HTTP (rotas, decorators, DTOs)
- Validação de entrada com `class-validator`
- Autenticação (`@Roles`, guards)
- Chamar **apenas** a Facade

### Facade
- Resolver contexto: obtém `accountId` via `CurrentUserService`
- Orquestrar Queries e Commands na ordem correta
- Controlar boundary transacional (quando múltiplos Commands)
- **Não contém** regra de negócio complexa
- **Não acessa** Repository nem PrismaService

### Query
- Leitura de dados com joins, includes e filtros
- Validação de existência (`NotFoundException`)
- Recebe contexto por parâmetro — nunca resolve sozinha
- Método principal: `execute(...params)`
- **Não altera** estado

### Command
- Uma intenção de negócio por Command
- Aplica regras de negócio e validações de domínio
- Gera UUID quando necessário (`uuidv4()`)
- Recebe contexto por parâmetro — nunca resolve sozinho
- Método principal: `execute(...params)`
- **Não faz** leitura complexa nem acessa Prisma

### Repository
- **Única** camada que acessa `PrismaService`
- Sem regras de negócio
- Sem contexto de usuário
- Soft delete: `is_deleted: true + deleted_at`
- Aceita `tx?: Prisma.TransactionClient` para transações externas

---

## Comunicação entre módulos

**Correto** — exportar e consumir comportamentos:
```typescript
// ModuloA exporta Query ou Command
exports: [FilesFacade, DeleteFileCommand]

// ModuloB consome via imports + injeção
imports: [forwardRef(() => FilesModule)]
constructor(private readonly deleteFileCommand: DeleteFileCommand) {}
```

**Proibido:**
- Importar Repository de outro módulo
- Acessar PrismaService de outro módulo
- Chamar Service genérico de outro módulo

---

## Estrutura de pastas padrão

```
src/modules/nome-modulo/
├── controllers/          ← ou nome-modulo.controller.ts
├── facade/
│   └── nome-modulo.facade.ts
├── queries/
│   ├── find-xxx.query.ts
│   └── list-xxx.query.ts
├── commands/
│   ├── create-xxx.command.ts
│   ├── update-xxx.command.ts
│   └── delete-xxx.command.ts
├── repositories/
│   └── nome-modulo.repository.ts
├── dto/
│   ├── create-xxx.dto.ts
│   └── update-xxx.dto.ts
├── prisma/
│   └── schema.prisma           ← schema modular do módulo
└── nome-modulo.module.ts
```

---

## Convenções de nomenclatura

| Camada     | Classe               | Arquivo                    | Método principal   |
|------------|----------------------|----------------------------|--------------------|
| Facade     | `XxxFacade`          | `xxx.facade.ts`            | nome do caso de uso |
| Query      | `FindXxxQuery`       | `find-xxx.query.ts`        | `execute()`        |
| Command    | `CreateXxxCommand`   | `create-xxx.command.ts`    | `execute()`        |
| Repository | `XxxRepository`      | `xxx.repository.ts`        | `findById()` etc.  |

**Prefixos obrigatórios:**
- Query: `Find`, `Get`, `List`, `Search`, `Count`
- Command: `Create`, `Update`, `Delete`, `Activate`, `Deactivate`

---

## Módulo: estrutura obrigatória

```typescript
@Module({
  imports: [CurrentUserModule],
  controllers: [XxxController],
  providers: [
    XxxRepository,
    FindXxxQuery,
    ListXxxQuery,
    CreateXxxCommand,
    UpdateXxxCommand,
    DeleteXxxCommand,
    XxxFacade,
  ],
  exports: [XxxFacade],  // exportar apenas Facade (ou Commands específicos)
})
export class XxxModule {}
```

---

## Schema Prisma

**Importante:** não editar `prisma/schema.prisma` na raiz.
Editar sempre o schema do módulo:

```
src/modules/[modulo]/prisma/schema.prisma
```

---

## Checklist de conformidade arquitetural

Antes de finalizar qualquer módulo:

**Controller**
- [ ] Injeta apenas Facade
- [ ] Sem lógica de negócio
- [ ] Usa decorators de autenticação

**Facade**
- [ ] Resolve contexto com `CurrentUserService`
- [ ] Não acessa Repository nem Prisma
- [ ] Métodos nomeados como casos de uso

**Query**
- [ ] Nome começa com `Find`, `Get` ou `List`
- [ ] Recebe tudo por parâmetro
- [ ] Não altera estado
- [ ] Lança `NotFoundException` quando necessário

**Command**
- [ ] Uma intenção por Command
- [ ] Recebe tudo por parâmetro
- [ ] Não acessa Prisma
- [ ] Não chama Query

**Repository**
- [ ] Único a importar `PrismaService`
- [ ] Sem regra de negócio
- [ ] Soft delete implementado
- [ ] Não compartilhado entre módulos

**Module**
- [ ] Exporta apenas Facade (ou Commands para uso externo)
- [ ] Repository não exportado

---

## Referências
