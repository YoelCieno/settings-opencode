---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript and JavaScript development.
---

# Coding Standards & Best Practices

Universal coding standards applicable across all projects.

## When to Activate

- Starting a new project or module
- Reviewing code for quality and maintainability
- Refactoring existing code to follow conventions
- Enforcing naming, formatting, or structural consistency
- Setting up linting, formatting, or type-checking rules
- Onboarding new contributors to coding conventions

## Code Quality Principles

Architectural and design patterns are covered separately:
- See [`instructions/development-patterns.md`] for KISSME, SINE, POLA, SoC+CQS, CBD

The sections below define language-level conventions for writing clean, maintainable code.

## TypeScript/JavaScript Standards

### Variable Naming

```typescript
// ✅ GOOD: Descriptive names
const marketSearchQuery = "election";
const isUserAuthenticated = true;
const totalRevenue = 1000;

// ❌ BAD: Unclear names
const q = "election";
const flag = true;
const x = 1000;
```

### Fluent Naming

```typescript
// ✅ GOOD: Fluent naming
private readonly searchCustomers = inject(SearchCustomersUseCase);

public searchCustomersBy(filters: SearchFilters) {
  return this.searchCustomers.by(filters); // ✅ GOOD - fluent
}

// ❌ BAD: Unclear names
public searchCustomers(searchFilters: SearchFilters) {
  return this.searchCustomers.search(searchFilters); // ❌ BAD - can't read it as fluent
}
```

### Function Naming

```typescript
// ✅ GOOD: Verb-noun pattern
async function fetchMarketData(marketId: string) {}
function calculateSimilarity(a: number[], b: number[]) {}
function isValidEmail(email: string): boolean {}

// ❌ BAD: Unclear or noun-only
async function market(id: string) {}
function similarity(a, b) {}
function email(e) {}
```

### Immutability Pattern (CRITICAL)

```typescript
// ✅ ALWAYS use spread operator
const updatedUser = {
  ...user,
  name: "New Name",
};

const updatedArray = [...items, newItem];

// ❌ NEVER mutate directly
user.name = "New Name"; // BAD
items.push(newItem); // BAD
```

### Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
async function fetchData(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error);
    throw new Error("Failed to fetch data");
  }
}

// ❌ BAD: No error handling
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
```

### Async/Await Best Practices

```typescript
// ✅ GOOD: Parallel execution when possible
const [users, markets, stats] = await Promise.all([
  fetchUsers(),
  fetchMarkets(),
  fetchStats(),
]);

// ❌ BAD: Sequential when unnecessary
const users = await fetchUsers();
const markets = await fetchMarkets();
const stats = await fetchStats();
```

### Type Safety

```typescript
// ✅ GOOD: Proper types
interface Market {
  id: string;
  name: string;
  status: "active" | "resolved" | "closed";
  created_at: Date;
}

function getMarket(id: string): Promise<Market> {
  // Implementation
}

// ❌ BAD: Using 'any'
function getMarket(id: any): Promise<any> {
  // Implementation
}
```

## API Design Standards

### REST API Conventions

```
GET    /api/markets              # List all markets
GET    /api/markets/:id          # Get specific market
POST   /api/markets              # Create new market
PUT    /api/markets/:id          # Update market (full)
PATCH  /api/markets/:id          # Update market (partial)
DELETE /api/markets/:id          # Delete market

# Query parameters for filtering
GET /api/markets?status=active&limit=10&offset=0
```

## File Organization

### Project Structure

See Codemaps in DOCS/CODEMAPS

### File Naming

```
services/user.service.ts          # camelCase for service modules
controllers/auth.controller.ts    # camelCase for controller modules
utils/formatDate.ts               # camelCase for utility modules
types/user.types.ts               # camelCase with .types suffix
constants/api.ts                  # camelCase for constants
```

## Comments & Documentation

### When to Comment

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during outages
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

// Deliberately using mutation here for performance with large arrays
items.push(newItem);

// ❌ BAD: Stating the obvious
// Increment counter by 1
count++;

// Set name to user's name
name = user.name;
```

### JSDoc for Public APIs

````typescript
/**
 * Calculates the total price including tax and discounts.
 *
 * @param basePrice - Item base price in cents
 * @param taxRate - Tax rate as decimal (e.g. 0.21 for 21%)
 * @param discountCode - Optional discount code
 * @returns Total price in cents
 * @throws {Error} If discount code is invalid or expired
 *
 * @example
 * ```typescript
 * const total = calculateTotal(1999, 0.21, 'SAVE10');
 * // Returns 2159 (1999 + 420 tax - 260 discount)
 * ```
 */
export function calculateTotal(
  basePrice: number,
  taxRate: number,
  discountCode?: string
): number {
  // Implementation
}
````

## Performance Best Practices

### Memoization

```typescript
// ✅ GOOD: Cache expensive results (memoization)
const cache = new Map<string, Result>();

function computeExpensiveValue(key: string): Result {
  if (cache.has(key)) return cache.get(key)!;
  const result = expensiveComputation(key);
  cache.set(key, result);
  return result;
}

// ✅ GOOD: Debounce rapid successive calls
let debounceTimer: ReturnType<typeof setTimeout>;
function handleRapidInput(query: string) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => processSearch(query), 300);
}
```

### Lazy Loading

```typescript
// ✅ GOOD: Lazy initialize expensive resources
let databaseConnection: Database | null = null;

function getDb(): Database {
  if (!databaseConnection) {
    databaseConnection = new Database(connectionConfig);
  }
  return databaseConnection;
}

// ✅ GOOD: Dynamic imports for deferred loading
async function loadPlugin(name: string) {
  const plugin = await import(`./plugins/${name}`);
  return plugin.initialize();
}
```

### Database Queries

```typescript
// ✅ GOOD: Select only needed columns
db.query("SELECT id, name, status FROM users WHERE id = $1", [userId]);

// ❌ BAD: SELECT * fetches unnecessary data
db.query("SELECT * FROM users WHERE id = $1", [userId]);

// ✅ GOOD: Use parameterized queries (prevents SQL injection)
const result = await db.query(
  "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
  [name, email]
);
```

## Testing Standards

### Test Structure (AAA Pattern)

```typescript
test("returns formatted date string for valid input", () => {
  // Arrange
  const input = new Date("2026-01-15");

  // Act
  const result = formatDate(input);

  // Assert
  expect(result).toBe("2026-01-15");
});
```

### Test Naming

```typescript
// ✅ GOOD: Descriptive test names
test("returns empty array when no matching records found", () => {});
test("throws validation error when email format is invalid", () => {});
test("falls back to default config when environment variable is missing", () => {});

// ❌ BAD: Vague test names
test("works", () => {});
test("test function", () => {});
```

### TDD First — Mandatory for All Code

All code implementation follows RED→GREEN→REFACTOR:

1. **RED**: Write a failing test first (or confirm existing tests fail RED)
2. **GREEN**: Write minimal implementation to pass tests
3. **REFACTOR**: Improve code while keeping tests GREEN

Exception: truly trivial changes (rename, dep bump, string change) may skip with explicit justification.

## Code Smell Detection

Watch for these anti-patterns:

### 1. Long Functions

```typescript
// ❌ BAD: Function > 50 lines
function processMarketData() {
  // 100 lines of code
}

// ✅ GOOD: Split into smaller functions
function processMarketData() {
  const validated = validateData();
  const transformed = transformData(validated);
  return saveData(transformed);
}
```

### 2. Deep Nesting

```typescript
// ❌ BAD: 3+ levels of nesting
if (user) {
  if (user.isAdmin) {
    if (market) {
	    if (hasPermission) {
	      // Do something
	    }
    }
  }
}

// ✅ GOOD: Early returns
if (!user) return;
if (!user.isAdmin) return;
if (!market) return;
if (!hasPermission) return;

// Do something
```

### 3. Magic Numbers

```typescript
// ❌ BAD: Unexplained numbers
if (retryCount > 3) {
}
setTimeout(callback, 500);

// ✅ GOOD: Named constants
const MAX_RETRIES = 3;
const DEBOUNCE_DELAY_MS = 500;

if (retryCount > MAX_RETRIES) {
}
setTimeout(callback, DEBOUNCE_DELAY_MS);
```

**Remember**: Code quality is not negotiable. Clear, maintainable code enables rapid development and confident refactoring.
