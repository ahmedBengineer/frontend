# Password Protection for Mutating Requests

## Overview
This feature adds a password prompt before any mutating HTTP request (POST, PUT, PATCH, DELETE) to protected API endpoints.

## Current Status
**DISABLED** - Set `ENABLED = true` in `hooks/useProtectedFetch.ts` to enable.

## Configuration

### Enable Protection
Edit `hooks/useProtectedFetch.ts`:
```typescript
const ENABLED = true; // Change from false to true
```

### Password
Default password: `"blocked"`

To change password, edit the comparison in `promptPassword` function:
```typescript
if (password === "your-new-password") { ... }
```

### Protected Paths
```typescript
const PROTECTED_PATHS = [
  "/api/workflow-studio/agents/",      // Workflow studio save/reload
  "/api/workflow-test/",               // Workflow test endpoints
  "/api/agents/agents/",               // Agent settings (tools, numbers, startup tools)
  "/api/custom_feature/custom-features/", // Custom tools CRUD
];
```

Add/remove paths as needed.

### Protected Methods
```typescript
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
```

## Files Using Protection
| File | Usage |
|------|-------|
| `app/dashboard/agent-settings/[agentId]/page.tsx` | `protectedFetch` for tools, numbers, startup tools, default tools |
| `app/dashboard/tools/page.tsx` | `protectedFetch` for tool delete |
| `components/CustomToolsForm.tsx` | `protectedFetch` for tool create/update |
| `components/workflow-editor/hooks/useAgentDefinition.ts` | `protectedFetchGlobal` for workflow GET/PATCH |

## How It Works
1. User clicks a mutating action (assign tool, save workflow, delete tool, etc.)
2. Browser prompt appears: `🔐 Protected action detected on <path>\nEnter password to proceed:`
3. Enter `"blocked"` → request proceeds
4. Wrong/empty → request cancelled, toast shows "Access Denied"
5. Password cached per-path for session (no re-prompt)

## To Re-enable Later
1. Open `hooks/useProtectedFetch.ts`
2. Change `const ENABLED = false` → `const ENABLED = true`
3. Uncomment the `PROTECTED_PATHS`, `MUTATING_METHODS`, and all function bodies
4. Restart dev server: `npm run dev`

## To Disable Quickly
Just set `const ENABLED = false` - no need to uncomment anything.