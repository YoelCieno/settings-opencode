# POLA (Principle Of Least Astonishment)

**Applies to:** `coder` subagent during implementation

## Real world example

Press elevator "Open" button — you expect it to open. If it plays a music note and waits 3 seconds first, you're surprised and annoyed. APIs are the same: do what the name says.

## In plain words

A function/module/API should behave the way a reader expects. Name, signature, return type, and side effects must form one coherent picture. No surprises.

## How to apply

```typescript
// ❌ Astonishing: "get" mutates state
function getUser(id: string) {
  this.lastAccessed = id;   // side effect!
  return db.users.find(id);
}

// ✅ POLA: query doesn't mutate
function getUser(id: string) {
  return db.users.find(id);
}

function recordAccess(userId: string) {
  this.lastAccessed = userId;
}

// ❌ Astonishing: parameter order violates convention
function sendEmail(html: string, recipient: string, subject: string) {}

// ✅ POLA: named params via object
interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}
function sendEmail(payload: EmailPayload) {}
```

> **Coder note:** `subagent-routing.md` follows POLA — every rule says "when X → use Y". Read one, predict the rest without reading them all.

## When to use

- Public APIs, function signatures
- Error handling (be consistent: throw vs return null, don't mix)
- Naming (verb-noun for commands, noun for queries)

## When not to use

- Performance-critical internals — inline/optimize, but document the surprise
