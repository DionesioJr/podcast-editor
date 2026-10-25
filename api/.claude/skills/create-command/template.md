# Template: Command

Código de referência para criar Commands neste projeto.

---

## Estrutura completa — CreateXxxCommand

```typescript
import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { XxxRepository } from '../repositories/xxx.repository';
import { CreateXxxDto } from '../dto/create-xxx.dto';

@Injectable()
export class CreateXxxCommand {
  private readonly logger = new Logger(CreateXxxCommand.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(accountId: number, dto: CreateXxxDto): Promise<model_name> {
    this.logger.log(`Criando registro para conta ${accountId}.`);

    const existing = await this.repository.findByAccountId(accountId);
    if (existing) {
      throw new ConflictException('Registro já existe para esta conta.');
    }

    const record = await this.repository.create({
      uuid: uuidv4(),
      accounts: { connect: { id: accountId } },
      title: dto.title,
      is_active: true,
      is_deleted: false,
    });

    this.logger.log(`Registro criado. UUID: ${record.uuid}.`);
    return record;
  }
}
```

---

## Estrutura completa — UpdateXxxCommand

```typescript
import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';
import { UpdateXxxDto } from '../dto/update-xxx.dto';

@Injectable()
export class UpdateXxxCommand {
  private readonly logger = new Logger(UpdateXxxCommand.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(uuid: string, dto: UpdateXxxDto): Promise<model_name> {
    this.logger.log(`Atualizando registro ${uuid}.`);

    const record = await this.repository.findByUuid(uuid);
    if (!record) {
      throw new NotFoundException('Registro não encontrado.');
    }
    if (record.is_deleted) {
      throw new UnprocessableEntityException('Registro removido não pode ser editado.');
    }

    const updated = await this.repository.update(uuid, {
      title: dto.title,
      updated_at: new Date(),
    });

    this.logger.log(`Registro atualizado. UUID: ${uuid}.`);
    return updated;
  }
}
```

---

## Estrutura completa — DeleteXxxCommand

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';

@Injectable()
export class DeleteXxxCommand {
  private readonly logger = new Logger(DeleteXxxCommand.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(uuid: string): Promise<model_name> {
    this.logger.log(`Removendo registro ${uuid}.`);

    const record = await this.repository.findByUuid(uuid);
    if (!record) {
      throw new NotFoundException('Registro não encontrado.');
    }

    const deleted = await this.repository.delete(uuid);

    this.logger.log(`Registro removido. UUID: ${uuid}.`);
    return deleted;
  }
}
```

---

## Estrutura completa — ActivateXxxCommand

```typescript
import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { model_name } from '@prisma/client';
import { XxxRepository } from '../repositories/xxx.repository';

@Injectable()
export class ActivateXxxCommand {
  private readonly logger = new Logger(ActivateXxxCommand.name);

  constructor(private readonly repository: XxxRepository) {}

  async execute(uuid: string): Promise<model_name> {
    this.logger.log(`Ativando registro ${uuid}.`);

    const record = await this.repository.findByUuid(uuid);
    if (!record) {
      throw new NotFoundException('Registro não encontrado.');
    }
    if (record.is_active) {
      throw new UnprocessableEntityException('Registro já está ativo.');
    }

    const activated = await this.repository.update(uuid, { is_active: true });

    this.logger.log(`Registro ativado. UUID: ${uuid}.`);
    return activated;
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
import { CreateXxxCommand } from './commands/create-xxx.command';
import { UpdateXxxCommand } from './commands/update-xxx.command';
import { DeleteXxxCommand } from './commands/delete-xxx.command';
import { XxxFacade } from './facade/xxx.facade';

@Module({
  imports: [CurrentUserModule],
  controllers: [XxxController],
  providers: [
    XxxRepository,
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

## Exceções disponíveis (NestJS)

| Situação                              | Exceção                           |
|---------------------------------------|-----------------------------------|
| Entidade não encontrada               | `NotFoundException`               |
| Recurso já existe (duplicado)         | `ConflictException`               |
| Estado inválido para a operação       | `UnprocessableEntityException`    |
| Permissão negada                      | `ForbiddenException`              |
| Dados de entrada inválidos            | `BadRequestException`             |

---

## Imports úteis

```typescript
import { Injectable, Logger } from '@nestjs/common';
import {
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { model_name, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
```
