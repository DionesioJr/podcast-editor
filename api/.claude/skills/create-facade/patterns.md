# Padrões Reais de Facade

Exemplos extraídos diretamente do código do projeto.

---

## Padrão 1: Facade simples (thin wrapper)

Para módulos com CRUD direto sem lógica de orquestração complexa.

**Referência:** `src/modules/folders/facade/folders.facade.ts`

```typescript
@Injectable()
export class FoldersFacade {
  private readonly logger = new Logger(FoldersFacade.name);

  constructor(
    private readonly currentUserService: CurrentUserService,
    private readonly findFolderByUuidQuery: FindFolderByUuidQuery,
    private readonly listFoldersQuery: ListFoldersQuery,
    private readonly createFolderCommand: CreateFolderCommand,
    private readonly updateFolderCommand: UpdateFolderCommand,
    private readonly deleteFolderCommand: DeleteFolderCommand,
  ) {}

  async create(dto: CreateFolderDto): Promise<file_folders> {
    const accountId = this.currentUserService.getAccountId();
    return this.createFolderCommand.execute(accountId, dto);
  }

  async findAll(): Promise<RootResponse> {
    const accountId = this.currentUserService.getAccountId();
    return this.listFoldersQuery.execute(accountId);
  }

  async findOne(uuid: string): Promise<file_folders> {
    const accountId = this.currentUserService.getAccountId();
    return this.findFolderByUuidQuery.execute(uuid, accountId);
  }

  async update(uuid: string, dto: UpdateFolderDto): Promise<file_folders> {
    const accountId = this.currentUserService.getAccountId();
    const folder = await this.findFolderByUuidQuery.execute(uuid, accountId); // resolve UUID → id
    return this.updateFolderCommand.execute(folder.id, folder.uuid, accountId, dto);
  }

  async remove(uuid: string): Promise<file_folders> {
    const accountId = this.currentUserService.getAccountId();
    return this.deleteRecursive(uuid, accountId); // delega para método privado complexo
  }

  // Lógica de fluxo complexa extraída para método privado
  private async deleteRecursive(uuid: string, accountId: number): Promise<file_folders> {
    this.logger.log(`Iniciando remoção recursiva da pasta ${uuid}`);

    const folder = await this.findFolderByUuidQuery.execute(uuid, accountId);
    const filesData = ((folder as any).files as { uuid: string }[]) ?? [];
    const childFolders = ((folder as any).child_folders as { uuid: string }[]) ?? [];

    // Orquestra múltiplos Commands — isso é responsabilidade da Facade
    for (const file of filesData) {
      await this.deleteFileCommand.execute(file.uuid, accountId);
    }
    for (const subfolder of childFolders) {
      await this.deleteRecursive(subfolder.uuid, accountId); // recursão no fluxo
    }

    return this.deleteFolderCommand.execute(folder.id, fileIds);
  }
}
```

**Aprendizados:**
- `findOne` → depois `command.execute(record.id, ...)` é o padrão para update/delete
- Lógica de fluxo complexa vai em método `private async`
- Cada método público começa com `getAccountId()`

---

## Padrão 2: Facade com orquestração entre módulos

Quando o caso de uso exige coordenar entidades de módulos diferentes.

**Referência:** `src/modules/accounts/facades/accounts.facade.ts`

```typescript
@Injectable()
export class AccountsFacade {
  constructor(
    // Queries e Commands do próprio módulo
    private readonly findAccountByUuidQuery: FindAccountByUuidQuery,
    private readonly createAccountCommand: CreateAccountCommand,
    // ...

    // Facades e Commands de outros módulos — permitido!
    private readonly usersFacade: UsersFacade,
    private readonly filesFacade: FilesFacade,
    private readonly currentUserService: CurrentUserService,
    private readonly sendEmailConfirmationUseCase: SendEmailConfirmationUseCase,
  ) {}

  // Caso de uso complexo: cria conta + usuário + notificação
  async create(dto: CreateAccountDto) {
    await this.validateInputs(dto);        // 1. validar fluxo (chama Queries)

    const account = await this.createAccountCommand.execute(dto, fileId);  // 2. criar conta

    const user = await this.getOrCreateUser(dto, account.uuid);  // 3. criar/buscar usuário

    await this.sendEmailConfirmation(...); // 4. notificar (infra externa)

    return { account, owner: user };       // 5. retornar resultado composto
  }

  // Caso de uso que orquestra entre módulos
  async addUserToAccount(accountUuid: string, dto: AddUserToAccountDto) {
    const account = await this.findAccountByUuidQuery.execute(accountUuid);
    const user = await this.usersFacade.findOneByEmail(dto.email); // Facade → Facade ✓
    if (!user) throw new ConflictException('Usuário não encontrado.');

    await this.addUserToAccountCommand.execute(account.id, user.id, dto);
    return account;
  }

  // Validações de fluxo em método privado
  private async validateInputs(dto: CreateAccountDto): Promise<void> {
    const existing = await this.findAccountByEmailQuery.execute(dto.email);
    if (existing) throw new ConflictException(`Email ${dto.email} já está em uso`);

    const instanceValidation = await this.validateInstanceQuery.execute(dto.instance);
    if (!instanceValidation.isAvailable) {
      throw new ConflictException(`A instância '${dto.instance}' já está em uso`);
    }
  }
}
```

**Aprendizados:**
- Facade pode injetar e chamar Facade de outro módulo
- Casos de uso complexos se decompõem em `private async` methods
- Validações de fluxo (verificar duplicidade antes de criar) ficam na Facade, não no Command
- Serviços externos (email, notificação) são orquestrados aqui

---

## Padrão 3: Facade cross-module (Auth → Accounts)

Quando um módulo depende fortemente da Facade de outro.

**Referência:** `src/modules/auth/facades/auth.facade.ts`

```typescript
@Injectable()
export class AuthFacade {
  constructor(
    // Queries do próprio módulo
    private readonly findUserByEmailQuery: FindUserByEmailQuery,
    private readonly validateTokenQuery: ValidateTokenQuery,

    // Queries de outros módulos — importados diretamente
    private readonly findAccountByInstanceQuery: FindAccountByInstanceQuery,
    private readonly findAccountOwnerQuery: FindAccountOwnerQuery,

    // Commands do próprio módulo
    private readonly loginCommand: LoginCommand,
    private readonly createAccessKeyCommand: CreateAccessKeyCommand,

    // Facade de outro módulo
    private readonly accountsFacade: AccountsFacade,

    // Serviços de infraestrutura
    private readonly tokenService: TokenService,
    private readonly sendPasswordRecoveryUseCase: SendPasswordRecoveryUseCase,
  ) {}

  // Fluxo multi-step: Login
  async login(dto: LoginDto): Promise<ITokens> {
    // 1. autenticar (Command com regra de negócio)
    const { user } = await this.loginCommand.execute(dto);

    // 2. buscar contas do usuário (Query de outro módulo via Facade)
    const accounts = await this.accountsFacade.findAllByUserUuid(user.uuid);

    // 3. buscar role (Query)
    const userRole = await this.findUserRoleQuery.execute(user.id, accountId);

    // 4. gerar tokens (serviço de infra)
    const tokens = this.tokenService.generateTokens(payload);

    // 5. registrar access key (Command)
    await this.createAccessKeyCommand.execute({ userId: user.id, accessToken: tokens.access_token, ... });

    return tokens;
  }

  // Fluxo composto: Signup = Create Account + Login
  async signup(dto: CreateAccountDto): Promise<ITokens> {
    const accountResult = await this.accountsFacade.create(dto); // Facade → Facade ✓
    return this.login({ email: accountResult.owner.email, password: dto.password });
  }
}
```

**Aprendizados:**
- Login é um bom exemplo de fluxo multi-step na Facade
- `signup` = `create account` + `login` — composição de casos de uso
- Queries de outros módulos podem ser importadas diretamente (sem precisar da Facade)
- `tokenService` (serviço interno sem acesso a banco) pode ser injetado na Facade

---

## Padrão 4: Dependência circular entre módulos

Quando dois módulos precisam um do outro (Files ↔ Folders).

```typescript
// files.module.ts
@Module({
  imports: [forwardRef(() => FoldersModule)],  // ← forwardRef no import
  providers: [..., FilesFacade],
  exports: [FilesFacade, DeleteFileCommand],   // ← exportar o que o outro módulo precisa
})

// files.facade.ts
constructor(
  @Inject(forwardRef(() => FindFolderByNameQuery))  // ← forwardRef na injeção
  private readonly findFolderByNameQuery: FindFolderByNameQuery,

  @Inject(forwardRef(() => CreateFolderCommand))
  private readonly createFolderCommand: CreateFolderCommand,
) {}
```

**Regra:** Use `forwardRef` apenas quando a dependência circular é inevitável.
Prefira sempre reorganizar para evitá-la.

---

## O que vai na Facade vs no Command

| Situação                                      | Onde fica        |
|-----------------------------------------------|------------------|
| Obter `accountId` do contexto                 | Facade           |
| Verificar se email já existe antes de criar   | Facade (fluxo)   |
| Validar formato do campo (ex: regex de email) | DTO / Command    |
| Regra de negócio (ex: limite de plano)        | Command          |
| Gerar senha temporária automática             | Facade ou Command|
| Orquestrar criar conta + criar usuário        | Facade           |
| Soft delete + atualizar status relacionado    | Command          |
| Enviar email após criar entidade              | Facade           |
| Calcular valor de cobrança                    | Command          |
| Buscar registro antes de atualizar            | Facade           |

---

## Erros comuns

### Facade acessando Repository diretamente

```typescript
// ❌ ERRADO — viola arquitetura
constructor(private readonly filesRepository: FilesRepository) {}

async findFile(uuid: string) {
  return this.filesRepository.findByUuid(uuid); // Repository direto
}

// ✅ CORRETO — via Query
async findFile(uuid: string) {
  const accountId = this.currentUserService.getAccountId();
  return this.findFileByUuidQuery.execute(uuid, accountId);
}
```

### Command recebendo UUID em vez de ID

```typescript
// ❌ ERRADO — Command não deve resolver UUID
async update(uuid: string, dto: UpdateDto) {
  return this.updateCommand.execute(uuid, dto); // UUID passado para o Command
}

// ✅ CORRETO — Facade resolve UUID → ID
async update(uuid: string, dto: UpdateDto) {
  const accountId = this.currentUserService.getAccountId();
  const record = await this.findQuery.execute(uuid, accountId);
  return this.updateCommand.execute(record.id, record.uuid, accountId, dto);
}
```

### Contexto resolvido fora da Facade

```typescript
// ❌ ERRADO — contexto resolvido no Controller
@Post()
async create(@Body() dto: CreateDto) {
  const accountId = this.currentUserService.getAccountId(); // Controller não deve fazer isso
  return this.facade.create(accountId, dto);
}

// ✅ CORRETO — Facade resolve o contexto
@Post()
async create(@Body() dto: CreateDto) {
  return this.facade.create(dto); // Controller passa só o DTO
}
```
