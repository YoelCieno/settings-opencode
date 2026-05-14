# SoC with CQS (Separation of Concerns + Command-Query Separation)

**Applies to:** `coder` subagent during implementation

## Real world example

Restaurant: chef cooks (command → mutates state). Waiter brings menus (query → reads state). If the waiter stopped to cook mid-service, chaos. Separate roles = predictable service.

## In plain words

- **SoC**: each module/function owns one concern
- **CQS**: every function is either:
  - A **command**: mutates state, returns `void`
  - A **query**: returns data, **zero side effects**
- Never both

## How to apply

```typescript
// ❌ Query with side effect
function getProject(id: string) {
  this.viewCount++;               // mutation inside a query!
  return db.projects.find(id);
}

// ✅ SoC + CQS: separated
function findProject(id: string) {
  return db.projects.find(id);         // pure query
}

function incrementViewCount(id: string) {
  return db.projects.update(id, {      // pure command
    $inc: { view_count: 1 },
  });
}

// ❌ Intertwined concerns
class UserService {
  async createUser(data: UserData) {
    const user = await db.users.create(data);      // command
    await emailService.sendWelcome(user.email);     // different concern
    analytics.track("signup", user.id);             // different concern
    return user;                                    // returns mutated state
  }
}

// ✅ Single concern per operation
class CreateUserUseCase {
  async execute(data: UserData) {
    return db.users.create(data);
  }
}
```

> **Coder note:** When implementing route handlers or use-cases, if a function both reads and writes, split it. One concern per function always.

## When to use

- All use-case/service layer code
- API route handlers
- Database access methods
- State management (Redux, etc.)

## When not to use

- Trivial CRUD where separation adds ceremony without benefit
