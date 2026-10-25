# Template: Query

Código de referência para criar Queries neste projeto.

---

## FindXxxByUuidQuery — busca por UUID com NotFoundException

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';

@Injectable()
export class FindXxxByUuidQuery {
  private readonly logger = new Logger(FindXxxByUuidQuery.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(uuid: string): Promise<model_name> {
    this.logger.log(`Buscando registro ${uuid}.`);

    const record = await this.repository.findByUuid(uuid);

    if (!record || record.is_deleted) {
      throw new NotFoundException('Registro não encontrado.');
    }

    return record;
  }
}
```

---

## FindXxxByAccountQuery — busca por conta, retorna null se não existir

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';

@Injectable()
export class FindXxxByAccountQuery {
  private readonly logger = new Logger(FindXxxByAccountQuery.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(accountId: number): Promise<model_name | null> {
    this.logger.log(`Buscando registro da conta ${accountId}.`);

    return this.repository.findByAccountId(accountId);
  }
}
```

---

## ListXxxQuery — listagem simples por conta

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';

@Injectable()
export class ListXxxQuery {
  private readonly logger = new Logger(ListXxxQuery.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(accountId: number): Promise<model_name[]> {
    this.logger.log(`Listando registros da conta ${accountId}.`);

    return this.repository.findManyByAccountId(accountId);
  }
}
```

---

## ListXxxQuery — listagem com filtros e paginação

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';
import { ListXxxDto } from '../dto/list-xxx.dto';

export interface ListXxxResult {
  data: model_name[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListXxxQuery {
  private readonly logger = new Logger(ListXxxQuery.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(accountId: number, dto: ListXxxDto): Promise<ListXxxResult> {
    this.logger.log(`Listando registros da conta ${accountId}.`);

    const { page = 1, limit = 20 } = dto;
    const [data, total] = await this.repository.findManyPaginated(accountId, {
      page,
      limit,
      search: dto.search,
    });

    return { data, total, page, limit };
  }
}
```

---

## FindXxxByUuidAndAccountQuery — busca com validação de posse

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';

@Injectable()
export class FindXxxByUuidAndAccountQuery {
  private readonly logger = new Logger(FindXxxByUuidAndAccountQuery.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(uuid: string, accountId: number): Promise<model_name> {
    this.logger.log(`Buscando registro ${uuid} da conta ${accountId}.`);

    const record = await this.repository.findByUuidAndAccountId(uuid, accountId);

    if (!record || record.is_deleted) {
      throw new NotFoundException('Registro não encontrado.');
    }

    return record;
  }
}
```

---

## Registro no Module

```typescript
import { Module } from '@nestjs/common';
import { CurrentUserModule } from '@/modules/current-user/current-user.module';
import { XxxController } from './xxx.controller';
import { XxxRepository } from './repositories/xxx.repository';
import { FindXxxByUuidQuery } from './queries/find-xxx-by-uuid.query';
import { FindXxxByAccountQuery } from './queries/find-xxx-by-account.query';
import { ListXxxQuery } from './queries/list-xxx.query';
import { CreateXxxCommand } from './commands/create-xxx.command';
import { UpdateXxxCommand } from './commands/update-xxx.command';
import { DeleteXxxCommand } from './commands/delete-xxx.command';
import { XxxFacade } from './facade/xxx.facade';

@Module({
  imports: [CurrentUserModule],
  controllers: [XxxController],
  providers: [
    XxxRepository,
    FindXxxByUuidQuery,
    FindXxxByAccountQuery,
    ListXxxQuery,
    CreateXxxCommand,
    UpdateXxxCommand,
    DeleteXxxCommand,
    XxxFacade,
  ],
  exports: [XxxFacade],
})
export class XxxModule {}
```

---

## Exports para uso entre módulos

Quando outro módulo precisar consumir uma Query deste módulo:

```typescript
// No module que exporta
exports: [XxxFacade, FindXxxByUuidQuery],

// No module que consome
imports: [forwardRef(() => XxxModule)],
// e injetar FindXxxByUuidQuery no constructor do Command ou Query que precisar
```

---

## Imports úteis

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { model_name } from '@prisma/client';
```
