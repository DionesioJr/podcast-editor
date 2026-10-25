# Template: Repository

Template completo baseado nos padrões reais do projeto.

Substitua:
- `ModelName` → nome do modelo Prisma (ex: `posts`, `brands`)
- `model_name` → nome snake_case do modelo Prisma (ex: `posts`, `brands`)
- `XxxRepository` → nome da classe (ex: `PostsRepository`)

---

## Template base

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { model_name, Prisma } from '@prisma/client';

@Injectable()
export class XxxRepository {
  private readonly logger = new Logger(XxxRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Leitura ────────────────────────────────────────────────────────────────

  async findById(id: number): Promise<model_name | null> {
    return this.prisma.model_name.findUnique({
      where: { id },
    });
  }

  async findByUuid(uuid: string): Promise<model_name | null> {
    return this.prisma.model_name.findUnique({
      where: { uuid, is_deleted: false },
    });
  }

  async findAll(accountId: number): Promise<model_name[]> {
    return this.prisma.model_name.findMany({
      where: {
        account_id: accountId,
        is_deleted: false,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Escrita ─────────────────────────────────────────────────────────────────

  async create(data: Prisma.model_nameCreateInput): Promise<model_name> {
    return this.prisma.model_name.create({ data });
  }

  async update(uuid: string, data: Prisma.model_nameUpdateInput): Promise<model_name> {
    return this.prisma.model_name.update({
      where: { uuid },
      data,
    });
  }

  async delete(uuid: string): Promise<model_name> {
    return this.prisma.model_name.update({
      where: { uuid },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });
  }

  // ─── Transações ──────────────────────────────────────────────────────────────

  async createWithTransaction(
    data: Prisma.model_nameCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<model_name> {
    return tx.model_name.create({ data });
  }

  async updateWithTransaction(
    uuid: string,
    data: Prisma.model_nameUpdateInput,
    tx: Prisma.TransactionClient,
  ): Promise<model_name> {
    return tx.model_name.update({
      where: { uuid },
      data,
    });
  }
}
```

---

## Variações comuns

### findByUuid com relações (include)

```typescript
async findByUuidWithRelations(uuid: string) {
  return this.prisma.model_name.findUnique({
    where: { uuid, is_deleted: false },
    include: {
      related_entity: {
        select: {
          uuid: true,
          name: true,
        },
      },
    },
  });
}
```

### findAll com filtros e paginação

```typescript
async findAllPaginated(
  accountId: number,
  skip: number,
  take: number,
) {
  return this.prisma.model_name.findMany({
    where: {
      account_id: accountId,
      is_deleted: false,
      is_active: true,
    },
    orderBy: { created_at: 'desc' },
    skip,
    take,
  });
}
```

### create com relação (connect)

```typescript
async create(accountId: number, data: Partial<Prisma.model_nameCreateInput>): Promise<model_name> {
  return this.prisma.model_name.create({
    data: {
      ...data,
      accounts: {
        connect: { id: accountId },
      },
    },
  });
}
```

### $transaction interna

```typescript
async createWithRelated(
  mainData: Prisma.model_nameCreateInput,
  relatedData: Prisma.related_nameCreateInput,
): Promise<model_name> {
  return this.prisma.$transaction(async (tx) => {
    const main = await tx.model_name.create({ data: mainData });

    await tx.related_name.create({
      data: {
        ...relatedData,
        model_id: main.id,
      },
    });

    return main;
  });
}
```

### Verificação de existência (booleano)

```typescript
async checkExists(field: string, excludeUuid?: string): Promise<boolean> {
  const where: Prisma.model_nameWhereInput = {
    some_field: field,
    is_deleted: false,
  };

  if (excludeUuid) {
    where.uuid = { not: excludeUuid };
  }

  const record = await this.prisma.model_name.findFirst({ where });
  return !!record;
}
```

### Método com parâmetro opcional de transação

```typescript
async update(
  uuid: string,
  data: Prisma.model_nameUpdateInput,
  tx?: Prisma.TransactionClient,
): Promise<model_name> {
  const client = tx || this.prisma;
  return client.model_name.update({
    where: { uuid },
    data,
  });
}
```
