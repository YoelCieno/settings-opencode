# Implementation Playbook

Full code templates for each step of adding a new feature using Fastify + Prisma + Zod.

## 1. Create Module Structure

```
modules/<module-name>/
├── core/
│   ├── ports/
│   │   ├── incoming/<verb-noun>.ts
│   │   └── outgoing/<verb-noun>-port.ts
│   ├── use-cases/<verb-noun>.ts
│   └── models/<request-model>.ts
├── infrastructure/
│   ├── adapters/<verb-noun>-adapter.ts
│   └── prisma/<module-name>-client.ts
├── routes/<verb-noun>-route.ts
└── index.ts
```

## 2. Define Zod Schemas (Request/Response Validation)

```typescript
// core/models/<verb-noun>.schema.ts
import { z } from 'zod';

export const <VerbNoun>RequestSchema = z.object({
  field: z.string().min(1).max(50),
});

export const <VerbNoun>ResponseSchema = z.object({
  id: z.string().uuid(),
  correlationId: z.string().uuid().optional(),
});

export type <VerbNoun>Request = z.infer<typeof <VerbNoun>RequestSchema>;
export type <VerbNoun>Response = z.infer<typeof <VerbNoun>ResponseSchema>;
```

## 3. Define Incoming Port (Use Case Interface)

```typescript
// core/ports/incoming/<verb-noun>.ts
import type { <VerbNoun>Request, <VerbNoun>Response } from '../models/<verb-noun>.schema.js';

export interface I<VerbNoun> {
  handleAsync(request: <VerbNoun>Request): Promise<<VerbNoun>Response>;
}
```

## 4. Define Outgoing Port (Repository Interface)

```typescript
// core/ports/outgoing/<verb-noun>-port.ts
import type { <VerbNoun>Request } from '../models/<verb-noun>.schema.js';

export interface I<VerbNoun>Port {
  validationCheck(value: string): Promise<boolean>;
  executeOperation(request: <VerbNoun>Request): Promise<string>;
}
```

## 5. Implement Use Case (Pure Business Logic)

```typescript
// core/use-cases/<verb-noun>.ts
import type { I<VerbNoun> } from '../ports/incoming/<verb-noun>.js';
import type { I<VerbNoun>Port } from '../ports/outgoing/<verb-noun>-port.js';
import type { <VerbNoun>Request, <VerbNoun>Response } from '../models/<verb-noun>.schema.js';

export class <VerbNoun> implements I<VerbNoun> {
  constructor(private readonly port: I<VerbNoun>Port) {}

  async handleAsync(request: <VerbNoun>Request): Promise<<VerbNoun>Response> {
    if (!request.field || request.field.trim() === '') {
      throw new Error('<Domain>Exception: Field is required');
    }

    const valid = await this.port.validationCheck(request.field);
    if (!valid) {
      throw new Error(`<Domain>Exception: ${request.field}`);
    }

    const id = await this.port.executeOperation(request);
    return { id };
  }
}
```

## 6. Implement Adapter (Prisma + Infrastructure)

```typescript
// infrastructure/adapters/<verb-noun>-adapter.ts
import type { I<VerbNoun>Port } from '../../core/ports/outgoing/<verb-noun>-port.js';
import type { <VerbNoun>Request } from '../../core/models/<verb-noun>.schema.js';
import { PrismaClient } from '@prisma/client';

export class <VerbNoun>Adapter implements I<VerbNoun>Port {
  constructor(private readonly prisma: PrismaClient) {}

  async validationCheck(value: string): Promise<boolean> {
    const existing = await this.prisma.<entity>.findFirst({
      where: { field: value },
    });
    return existing === null;
  }

  async executeOperation(request: <VerbNoun>Request): Promise<string> {
    const entity = await this.prisma.<entity>.create({
      data: { field: request.field },
    });
    return entity.id;
  }
}
```

## 7. Create Fastify Route with Schema Validation

```typescript
// routes/<verb-noun>-route.ts
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { <VerbNoun>RequestSchema, <VerbNoun>ResponseSchema } from '../core/models/<verb-noun>.schema.js';
import type { I<VerbNoun> } from '../core/ports/incoming/<verb-noun>.js';

export const create<VerbNoun>Route = (useCase: I<VerbNoun>): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.post<{
      Body: <VerbNoun>Request;
      Reply: <VerbNoun>Response;
    }>(
      '/api/<resource>',
      {
        schema: {
          body: <VerbNoun>RequestSchema,
          response: {
            201: <VerbNoun>ResponseSchema,
            400: z.object({ error: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const result = await useCase.handleAsync(request.body);
          return reply.code(201).send(result);
        } catch (error) {
          return reply.code(400).send({
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );
  };
};
```

## 8. Register Module (Fastify Plugin)

```typescript
// index.ts
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { <VerbNoun> } from './core/use-cases/<verb-noun>.js';
import { <VerbNoun>Adapter } from './infrastructure/adapters/<verb-noun>-adapter.js';
import { create<VerbNoun>Route } from './routes/<verb-noun>-route.js';

export const <ModuleName>Module: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient();

  // Outgoing port -> adapter
  const port = new <VerbNoun>Adapter(prisma);

  // Incoming port -> use case
  const useCase: I<VerbNoun> = new <VerbNoun>(port);

  // Register routes
  await fastify.register(create<VerbNoun>Route(useCase));
};

export default <ModuleName>Module;
```

## 9. Register Module in App

```typescript
// app.ts or server.ts
import Fastify from 'fastify';
import { <ModuleName>Module } from './modules/<module-name>/index.js';

const fastify = Fastify({ logger: true });

// Register modules
await fastify.register(<ModuleName>Module, { prefix: '/api' });

// Start server
try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

## 10. Add Domain Exceptions (If Needed)

```typescript
// core/exceptions/<specific>-exception.ts
export class <Specific>Exception extends Error {
  constructor(detail: string) {
    super(`<User-friendly message>: ${detail}`);
    this.name = '<Specific>Exception';
  }
}
```
