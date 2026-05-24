# Project Conventions

These conventions apply only to this project.

## Branch Naming

Use kebab-case for the work description.

- `feature/#issue-number-work-description`
- `fix/#issue-number-work-description`
- `refactor/#issue-number-work-description`

Examples:

- `feature/#52-chat-history-filter`
- `fix/#28-vercel-env-health-diagnostics`
- `refactor/#61-auth-store-cleanup`

## PR And Issue Naming

- `feature: work description`
- `fix: work description`
- `refactor: work description`

## Commit Messages

Write commit messages in English and append the issue number at the end.

Format:

```text
type :: description #issue-number
```

Example:

```text
fix :: axios interceptors #52
```

Allowed types:

- `feat`: Add a new feature.
- `chore`: Build tasks or package manager changes without production code changes.
- `fix`: Fix a bug.
- `refactor`: Refactor code.
- `style`: Formatting, missing semicolons, or changes with no code behavior changes.
- `test`: Add or refactor tests without production code changes.
- `comment`: Add or update necessary comments.
- `rename`: Only rename or move files, folders, or functions.
- `remove`: Only delete files.
- `!HOTFIX`: Urgent fix for a critical bug.

## File And Folder Naming

### Folders

Use kebab-case.

Examples:

- `app/sign-in/`
- `app/chat-history/`
- `app/user-settings/`

Avoid camelCase, PascalCase, and snake_case folder names.

### Component Files

Use PascalCase.

Examples:

- `components/chat/ChatMessage.tsx`
- `components/ui/Button.tsx`
- `components/layout/Header.tsx`

### Next.js Reserved Page Files

Use lowercase Next.js reserved filenames.

Examples:

- `app/page.tsx`
- `app/layout.tsx`
- `app/loading.tsx`
- `app/error.tsx`
- `app/not-found.tsx`

### API Routes

Use lowercase route filenames.

Example:

- `app/api/chat/route.ts`
- `app/api/sessions/route.ts`

### Hooks

Use camelCase and start with `use`.

Examples:

- `hooks/useChat.ts`
- `hooks/useChatHistory.ts`
- `hooks/useStreamingResponse.ts`

### Utilities

Use camelCase.

Examples:

- `lib/utils.ts`
- `lib/ai/client.ts`
- `lib/formatting.ts`

### Types

Use camelCase or `index`.

Examples:

- `types/index.ts`
- `types/chat.ts`
- `types/user.ts`

### Config Files

Use kebab-case or the framework/tooling convention.

Examples:

- `next.config.ts`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `components.json`

## Variable Naming

- Variables and functions: camelCase.
- Constants: UPPER_SNAKE_CASE.
- Components: PascalCase.
- Interfaces and types: PascalCase.
- Enums: PascalCase.
- Enum values: UPPER_SNAKE_CASE.
