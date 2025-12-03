# Agent Context & Common Issues

This file documents common issues, solutions, and architectural decisions for LLM agents working on this codebase.

## Table of Contents
- [Elysia Plugin Context Propagation](#elysia-plugin-context-propagation)
- [Supabase Authentication Integration](#supabase-authentication-integration)

---

## Elysia Plugin Context Propagation

### Issue: Derived Context Not Available in Plugins

**Error:**
```
src/cms.ts(27,20): error TS2339: Property 'user' does not exist on type...
src/cms.ts(222,30): error TS2339: Property 'supabaseClient' does not exist on type...
```

**Root Cause:**
When using Elysia plugins (`.use()`), derived context from the parent app is not automatically available in the plugin's route handlers. The `derive()` function in the parent app doesn't propagate to child plugins.

**Problematic Pattern:**
```typescript
// ❌ This doesn't work - context doesn't propagate
const app = new Elysia()
  .use(cmsPlugin)
  .derive(async ({ headers }) => {
    return { user: ..., supabaseClient: ... };
  });
```

**Solution:**
1. **Move derive before plugin usage** in the parent app:
```typescript
// ✅ Correct order
const app = new Elysia()
  .derive(async ({ headers }) => {
    return { user: ..., supabaseClient: ... };
  })
  .use(cmsPlugin);
```

2. **Add derive in the plugin itself** to access parent context:
```typescript
// ✅ In cmsPlugin
export const cmsPlugin = new Elysia({ name: "cms" })
  .derive((context: any) => {
    // Access derived context from parent app
    return {
      user: context.user || null,
      supabaseClient: context.supabaseClient || null,
    };
  })
  // ... routes can now access user and supabaseClient
```

**Key Takeaway:**
- Elysia plugins are separate instances and don't automatically inherit parent context
- Use `.derive()` in both parent and plugin to propagate context
- Order matters: derive must come before plugin usage in parent app

**Files Affected:**
- `src/index.ts` - Parent app derive order
- `src/cms.ts` - Plugin derive to access parent context

**Date Fixed:** 2024

---

## Supabase Authentication Integration

### Architecture Overview

The application uses Supabase Auth for authentication with the following flow:

1. **Login** (`POST /api/v1/auth/login`)
   - Uses `supabase.auth.signInWithPassword()`
   - Returns Supabase JWT access token
   - Token must be included in `Authorization: Bearer <token>` header

2. **Context Derivation** (`src/index.ts`)
   - Extracts token from Authorization header
   - Verifies token with `supabase.auth.getUser()`
   - Creates authenticated Supabase client using `createAuthenticatedClient()`
   - Adds `user` and `supabaseClient` to request context

3. **RLS Enforcement**
   - CMS storage uses authenticated Supabase client when available
   - Row Level Security policies check `auth.role() = 'authenticated'`
   - Public read access, authenticated write access

### Important Notes

- **Token Format:** Always use `Authorization: Bearer <token>` header
- **Client Creation:** Use `createAuthenticatedClient(token)` helper for authenticated operations
- **Storage Selection:** CMS automatically uses authenticated client if available, falls back to unauthenticated or in-memory
- **User Creation:** Users must be created in Supabase Dashboard > Authentication > Users

### Related Files
- `src/auth.ts` - Authentication routes
- `src/supabase.ts` - Supabase client setup and helpers
- `src/cms-storage-supabase.ts` - Supabase storage implementation
- `supabase-schema.sql` - Database schema with RLS policies

---

## Common Patterns

### Accessing Derived Context in Routes

```typescript
// In route handler
async ({ user, supabaseClient, body }) => {
  // user and supabaseClient are available from derive
  const storage = getCMSStorage(supabaseClient);
  // ...
}
```

### Creating Authenticated Supabase Client

```typescript
import { createAuthenticatedClient } from "./supabase";

const authenticatedClient = createAuthenticatedClient(accessToken);
// Use authenticatedClient for RLS-protected operations
```

### CMS Storage Selection

```typescript
function getCMSStorage(supabaseClient?: any) {
  if (supabase && supabaseClient) {
    return new SupabaseCMSStorage(supabaseClient); // Authenticated
  }
  if (supabase) {
    return new SupabaseCMSStorage(); // Unauthenticated
  }
  return new InMemoryCMSStorage(); // Fallback
}
```

---

## Future Reference

When encountering similar issues:
1. Check the order of `.derive()` and `.use()` calls
2. Verify context propagation in plugins
3. Ensure TypeScript types match the actual runtime context
4. Test with both authenticated and unauthenticated requests

