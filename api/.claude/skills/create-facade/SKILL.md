---
name: create-facade
description: Cria a camada Facade (Orchestrator) seguindo a arquitetura Clean Architecture + CQRS Leve do projeto. A Facade orquestra Queries e Commands, resolve contexto do usuário e controla o fluxo de negócio. Use ao criar uma nova Facade, adicionar casos de uso a uma existente, ou revisar se a orquestração está correta.
when_to_use: >
  Acionar ao criar facade, orchestrator ou application service de um módulo.
  Acionar ao adicionar um novo caso de uso a um módulo existente.
  Acionar ao decidir como orquestrar múltiplas queries e commands.
  Acionar ao precisar resolver contexto de usuário (accountId, userId).
  Acionar ao perguntar "onde chamar currentUserService?" ou "como coordenar Query + Command?".
allowed-tools: Read Glob Grep Write Edit
---

# Skill: Criar Facade

Você está criando a **camada Facade** deste projeto NestJS.

> Para padrões reais com exemplos do código do projeto: [patterns.md](patterns.md)

---

## Regra de ouro

> **A Facade coordena o _como_ as coisas acontecem, mas nunca decide o _que_ é correto no domínio.**

Se a Facade começa a parecer inteligente demais, ela já está errada.

---

## Posição no fluxo (imutável)

```
Controller
    ↓
Facade  ← você está aqui
    ↓──────────────────↓
Query Service        Command
    ↓
Repository → Prisma
```

---

## Responsabilidades

**A Facade DEVE:**
- Obter contexto via `CurrentUserService` (`accountId`, `userId`)
- Orquestrar Queries e Commands na ordem correta
- Encadear ações (buscar → validar existência → executar Command)
- Resolver UUIDs em IDs antes de chamar Commands
- Chamar Facades de outros módulos quando necessário
- Ter métodos nomeados como casos de uso do negócio

**A Facade NÃO DEVE:**
- Acessar `PrismaService` ou Repository diretamente
- Conter regras de domínio profundas (cálculos, validações de estado)
- Resolver contexto nos Commands — isso é exclusivo da Facade
- Virar "Deus Object" com lógica demais

---

## Regras de dependência

**Permitido:**
```
Controller     → Facade
Facade         → Query
Facade         → Command
Facade         → Facade de outro módulo
Facade         → CurrentUserService
Facade         → serviços de infraestrutura (email, storage etc.)
```

**Proibido:**
```
Facade         → Repository      ← bypass da arquitetura
Facade         → PrismaService   ← bypass da arquitetura
Query          → Facade          ← dependência circular
Command        → Facade          ← dependência circular
```

---

## Antes de criar: perguntas obrigatórias

1. **Qual módulo?** → A Facade pertence a esse módulo
2. **Quais casos de uso?** → Liste os métodos públicos (um por operação do Controller)
3. **Precisa de contexto?** → `getAccountId()` e/ou `getUserId()`?
4. **Quais Queries e Commands?** → Mapeie Query/Command para cada caso de uso
5. **Dependências externas?** → Outros módulos, serviços de email, storage?
6. **Há fluxos compostos?** → Ex: buscar → validar → criar → notificar

---

## Estrutura obrigatória

```
src/modules/nome-modulo/
└── facades/                    ← ou facade/ (ambos existem no projeto)
    └── nome-modulo.facade.ts
```

---

## Convenções de nomenclatura

| Item    | Padrão            | Exemplo               |
|---------|-------------------|-----------------------|
| Classe  | `XxxFacade`       | `AccountsFacade`      |
| Arquivo | `xxx.facade.ts`   | `accounts.facade.ts`  |
| Pasta   | `facades/`        | `facades/`            |
| Métodos | casos de uso      | `create`, `update`, `findOne`, `addUserToAccount` |

---

## Skeleton de uma Facade

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CurrentUserService } from '@/shared/current-user/current-user';
import { FindXxxQuery } from '../queries/find-xxx.query';
import { ListXxxQuery } from '../queries/list-xxx.query';
import { CreateXxxCommand } from '../commands/create-xxx.command';
import { UpdateXxxCommand } from '../commands/update-xxx.command';
import { DeleteXxxCommand } from '../commands/delete-xxx.command';
import { CreateXxxDto } from '../dto/create-xxx.dto';
import { UpdateXxxDto } from '../dto/update-xxx.dto';

@Injectable()
export class XxxFacade {
  private readonly logger = new Logger(XxxFacade.name);

  constructor(
    private readonly currentUserService: CurrentUserService,
    private readonly findXxxQuery: FindXxxQuery,
    private readonly listXxxQuery: ListXxxQuery,
    private readonly createXxxCommand: CreateXxxCommand,
    private readonly updateXxxCommand: UpdateXxxCommand,
    private readonly deleteXxxCommand: DeleteXxxCommand,
  ) {}

  async create(dto: CreateXxxDto) {
    const accountId = this.currentUserService.getAccountId();
    return this.createXxxCommand.execute(accountId, dto);
  }

  async findAll() {
    const accountId = this.currentUserService.getAccountId();
    return this.listXxxQuery.execute(accountId);
  }

  async findOne(uuid: string) {
    const accountId = this.currentUserService.getAccountId();
    return this.findXxxQuery.execute(uuid, accountId);
  }

  async update(uuid: string, dto: UpdateXxxDto) {
    const accountId = this.currentUserService.getAccountId();
    const record = await this.findXxxQuery.execute(uuid, accountId); // valida existência
    return this.updateXxxCommand.execute(record.id, record.uuid, accountId, dto);
  }

  async remove(uuid: string) {
    const accountId = this.currentUserService.getAccountId();
    return this.deleteXxxCommand.execute(uuid, accountId);
  }
}
```

---

## Padrões obrigatórios do projeto

### 1. Resolver contexto sempre na Facade
```typescript
// SEMPRE primeiro passo de qualquer método
const accountId = this.currentUserService.getAccountId();
```

### 2. Validar existência antes de escrever (find → command)
```typescript
async update(uuid: string, dto: UpdateXxxDto) {
  const accountId = this.currentUserService.getAccountId();
  const record = await this.findXxxQuery.execute(uuid, accountId); // lança NotFoundException se não existir
  return this.updateXxxCommand.execute(record.id, record.uuid, accountId, dto);
}
```

### 3. Resolver UUID → ID antes do Command
```typescript
// Command recebe ID numérico, não UUID
// A Facade faz a resolução
const folder = await this.findFolderByUuidQuery.execute(folderUuid, accountId);
return this.createXxxCommand.execute(accountId, dto, folder.id); // passa folder.id, não folderUuid
```

### 4. Fluxos compostos com métodos privados
```typescript
// Método público: delegam para privados para manter clareza
async create(dto: CreateXxxDto) {
  await this.validateInputs(dto);     // ← método privado para validações de fluxo
  const result = await this.createXxxCommand.execute(dto);
  await this.sendNotification(result); // ← método privado para pós-processamento
  return result;
}

private async validateInputs(dto: CreateXxxDto): Promise<void> {
  const existing = await this.findXxxByEmailQuery.execute(dto.email);
  if (existing) throw new ConflictException('Registro já existe.');
}
```

### 5. Dependência circular entre módulos: forwardRef
```typescript
import { Inject, forwardRef } from '@nestjs/common';

constructor(
  @Inject(forwardRef(() => OtherModuleQuery))
  private readonly otherModuleQuery: OtherModuleQuery,
) {}
```

---

## Registro no Module

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
    XxxFacade,         // ← registrar
  ],
  exports: [XxxFacade], // ← exportar (único export padrão)
})
export class XxxModule {}
```

---

## Checklist de validação

**Estrutura**
- [ ] Arquivo em `facades/` ou `facade/` do módulo
- [ ] Classe termina com `Facade`
- [ ] Decorado com `@Injectable()`
- [ ] `Logger` inicializado com `Logger(XxxFacade.name)`

**Contexto**
- [ ] `currentUserService.getAccountId()` chamado dentro de cada método (não no construtor)
- [ ] Commands recebem IDs numéricos, não UUIDs de entidades relacionadas

**Fluxo**
- [ ] Métodos nomeados como casos de uso (não como operações CRUD genéricas)
- [ ] Nenhum acesso direto a Repository ou PrismaService
- [ ] `forwardRef` usado onde há dependência circular entre módulos

**Module**
- [ ] Registrado em `providers`
- [ ] Exportado em `exports`
- [ ] `CurrentUserModule` importado

**Qualidade**
- [ ] Textos de log em português brasileiro correto
- [ ] Métodos públicos sem lógica de domínio profunda
- [ ] Fluxos complexos extraídos para métodos privados

---

## Referências do projeto

- Facade simples: `src/modules/folders/facade/folders.facade.ts`
- Facade com orquestração entre módulos: `src/modules/accounts/facades/accounts.facade.ts`
- Facade cross-module (Auth → Accounts): `src/modules/auth/facades/auth.facade.ts`
