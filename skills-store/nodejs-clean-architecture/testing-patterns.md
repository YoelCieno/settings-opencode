# Testing Patterns

## Narrow (Unit) Tests — Mock Outgoing Ports

```typescript
// tests/narrow/<module-name>/<verb-noun>.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { <VerbNoun> } from '../../modules/<module-name>/core/use-cases/<verb-noun>.js';
import type { I<VerbNoun>Port } from '../../modules/<module-name>/core/ports/outgoing/<verb-noun>-port.js';

describe('<VerbNoun>', () => {
  let useCase: <VerbNoun>;
  let port: I<VerbNoun>Port;

  beforeEach(() => {
    port = {
      validationCheck: vi.fn(),
      executeOperation: vi.fn(),
    } as I<VerbNoun>Port;
    useCase = new <VerbNoun>(port);
  });

  it('should return result when successful', async () => {
    vi.spyOn(port, 'validationCheck').mockResolvedValue(true);
    vi.spyOn(port, 'executeOperation').mockResolvedValue('new-uuid');

    const result = await useCase.handleAsync({ field: 'value' });

    expect(result.id).toBeTruthy();
    expect(port.executeOperation).toHaveBeenCalledWith({ field: 'value' });
  });

  it('should throw exception when business rule violated', async () => {
    vi.spyOn(port, 'validationCheck').mockResolvedValue(false);

    await expect(useCase.handleAsync({ field: 'value' })).rejects.toThrow(
      '<Domain>Exception'
    );
  });
});
```

## Wide (Integration) Tests — Full HTTP Pipeline with fastify.inject()

```typescript
// tests/wide/<module-name>/<verb-noun>-endpoint.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import { <ModuleName>Module } from '../../modules/<module-name>/index.js';
import { PrismaClient } from '@prisma/client';

describe('<VerbNoun> Endpoint', () => {
  let fastify: FastifyInstance;
  let prisma: PrismaClient;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    prisma = new PrismaClient();

    // Clean up test data
    await prisma.<entity>.deleteMany();

    // Register module
    await fastify.register(<ModuleName>Module);
    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
    await prisma.$disconnect();
  });

  it('should return 201 Created when valid', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/<resource>',
      payload: { field: 'value' },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.id).toBeTruthy();
  });

  it('should return 400 Bad Request when invalid', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/<resource>',
      payload: { field: '' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error).toBeTruthy();
  });
});
```

## E2E Tests with Test Database

```typescript
// tests/e2e/<module-name>.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { <ModuleName>Module } from '../../modules/<module-name>/index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_TEST_URL },
  },
});

describe('<ModuleName> E2E', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(<ModuleName>Module);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await prisma.$disconnect();
  });

  it('should handle full CRUD flow', async () => {
    // Create
    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/api/<resource>',
      payload: { field: 'test-value' },
    });
    expect(createResponse.statusCode).toBe(201);
    const { id } = JSON.parse(createResponse.payload);

    // Read, Update, Delete...
  });
});
```

## Key Libraries

| Library | Purpose |
|---------|---------|
| **fastify** | High-performance web framework with plugin architecture |
| **zod** | Runtime schema validation (request/response) |
| **@prisma/client** | Type-safe ORM for database access |
| **vitest** | Fast unit/integration test runner |
| **fastify.inject()** | HTTP injection for testing without network |

## Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```
