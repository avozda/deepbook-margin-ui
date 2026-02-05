# AGENTS.md - AI Coding Agent Guidelines

This document provides guidelines for AI agents working in this codebase.

## Technology Stack

- **Framework**: SolidJS + SolidStart (SSR-enabled)
- **Build Tool**: Vinxi (uses Vite under the hood)
- **Styling**: Tailwind CSS v4 (CSS-first config)
- **UI Components**: Kobalte (headless primitives)
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint (code quality, unused vars, SolidJS patterns)
- **Formatting**: Prettier (code style)
- **Node.js**: >=22 required

## Build/Dev Commands

```bash
bun dev          # Development server
bun build        # Production build
bun start        # Start production server
bun lint         # Run ESLint checks
bun lint:fix     # Run ESLint with auto-fix
bun format       # Format code with Prettier
bun format:check # Check formatting without writing
```

**Note**: No test commands configured yet. No testing framework exists.

## Linting & Formatting

### ESLint

- **Purpose**: Code quality checks, unused variables/imports, SolidJS reactivity patterns
- **Config**: `eslint.config.js` (flat config format)
- **Type checking**: Disabled - TypeScript handles type checking
- **Rules**: Focuses on unused vars, SolidJS best practices, basic code quality

### Prettier

- **Purpose**: Code formatting (indentation, quotes, semicolons, line breaks)
- **Config**: `.prettierrc`
- **Settings**:
  - Double quotes
  - Semicolons enabled
  - 2-space indentation
  - Trailing commas (ES5)
  - 80 character line width
  - Tailwind CSS class sorting (via plugin)

**Integration**: ESLint and Prettier are configured to work together via `eslint-config-prettier` to avoid conflicts.

## Project Structure

```
src/
├── app.tsx              # Root app with Router and Suspense
├── app.css              # Tailwind v4 config + design tokens
├── routes/              # File-based routing
│   ├── index.tsx        # Home page (/)
│   └── [...404].tsx     # 404 catch-all
├── components/
│   ├── Nav.tsx          # Navigation
│   └── ui/              # Reusable UI components (button.tsx, etc.)
└── lib/                 # Utilities (cva.ts, use-mobile.ts, etc.)
```

## Code Style Guidelines

### Imports

1. Use `@/` path alias for `src/` imports:

   ```typescript
   import { Button } from "@/components/ui/button";
   ```

2. Order: external packages first, then internal (`@/`) imports

3. Use `import type` for type-only imports:
   ```typescript
   import type { ComponentProps, ValidComponent } from "solid-js";
   ```
4. Do not write comments

### File Naming

- **Components**: PascalCase (`Counter.tsx`, `Nav.tsx`)
- **UI components**: lowercase in `ui/` folder (`button.tsx`)
- **Utilities/hooks**: kebab-case (`use-mobile.ts`)
- **Routes**: lowercase (`index.tsx`, `about.tsx`)

### Component Patterns

**Always use named exports and arrow functions**:

```typescript
export const MyComponent = () => {
  return <div>...</div>;
};
```

**Components with props**:

```typescript
type MyComponentProps = {
  title: string;
};

export const MyComponent = (props: MyComponentProps) => {
  return <div>{props.title}</div>;
};
```

**Generic UI components**:

```typescript
export const Button = <T extends ValidComponent = "button">(
  props: ButtonProps<T>
) => {
  const [local, rest] = splitProps(props, ["class", "variant", "size"]);
  return <ButtonPrimitive class={buttonVariants({...})} {...rest} />;
};
```

**Exception - SolidStart requires default exports for**:

- `app.tsx` (root App component)
- Route files in `routes/` folder (`index.tsx`, `[...404].tsx`, etc.)
- `entry-server.tsx` (server handler)

For these files, use named function declarations to preserve the function name (useful for debugging):

```typescript
export default function Home() {
  return <main>...</main>;
}
```

### Dialog Components

Components that open dialogs should be self-contained — include the Dialog, DialogTrigger, and DialogContent within the component itself:

```typescript
export const Settings = () => {
  return (
    <Dialog>
      <DialogTrigger as={Button} variant="ghost" size="icon">
        <SettingsIcon class="size-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        {/* Content here */}
      </DialogContent>
    </Dialog>
  );
};
```

This pattern keeps dialog logic encapsulated and makes components easier to use:

```typescript
// Usage is simple - no wrapper needed
<Settings />
<ConnectButton />
```

### SolidJS Patterns

1. **Signals for state**:

   ```typescript
   const [count, setCount] = createSignal(0);
   ```

2. **Call signals as functions** to read values:

   ```typescript
   // Correct
   <span>{count()}</span>

   // Wrong - don't use like React
   <span>{count}</span>
   ```

3. **Use `splitProps`** to separate component props:

   ```typescript
   const [local, rest] = splitProps(props, ["class", "variant"]);
   ```

4. **SSR awareness** - check `isServer` for browser-only code:

   ```typescript
   import { isServer } from "solid-js/web";
   if (isServer) return () => false;
   ```

5. **Cleanup with `onCleanup`** for event listeners

6. **TanStack Query Reactivity** - Never destructure query results directly. Keep the query object and access properties inside reactive contexts (`createMemo`, `createEffect`, or JSX):

   ```typescript
   // WRONG - loses reactivity, values read once at destructure time
   const { data, isLoading } = useMyQuery();
   const value = data?.someField ?? 0; // NOT reactive

   // CORRECT - stays reactive
   const myQuery = useMyQuery();
   const value = createMemo(() => myQuery.data?.someField ?? 0);

   // In JSX, access directly
   <Show when={myQuery.isLoading}>Loading...</Show>
   <div>{myQuery.data?.someField}</div>
   ```

   This applies to all `@tanstack/solid-query` hooks (`useQuery`, `useMutation`, etc.). The returned object has reactive getters that must be accessed within a tracking scope.

7. **Returning reactive values from hooks** - When creating custom hooks that derive values from queries or signals, return getters (functions) instead of computed values:

   ```typescript
   // WRONG - computed once, not reactive
   export function useMyHook() {
     const query = useQuery(...);
     const derivedValue = query.data?.value ?? 0;
     return { derivedValue, isLoading: query.isLoading };
   }

   // CORRECT - returns reactive getters
   export function useMyHook() {
     const query = useQuery(...);
     const derivedValue = () => query.data?.value ?? 0;
     const isLoading = () => query.isLoading;
     return { derivedValue, isLoading };
   }
   ```

### Styling

1. **Use `class` attribute** (not `className`):

   ```tsx
   <div class="flex items-center gap-2">
   ```

2. **CVA for component variants** with tailwind-merge:

   ```typescript
   export const buttonVariants = cva({
     base: ["inline-flex items-center..."],
     variants: {
       variant: { default: "...", destructive: "..." },
       size: { default: "h-9 px-4", sm: "h-8 px-3" },
     },
     defaultVariants: { variant: "default", size: "default" },
   });
   ```

3. **Design tokens** via CSS variables (OKLCH color space in `app.css`)

4. **Dark mode** uses Kobalte's `[data-kb-theme="dark"]` selector

### TypeScript

1. **Strict mode enabled** - no implicit any, null checks required

2. **Use `VariantProps`** for CVA component types:

   ```typescript
   type ButtonProps = ComponentProps<typeof ButtonPrimitive> &
     VariantProps<typeof buttonVariants>;
   ```

3. **Generic components** for polymorphism:
   ```typescript
   export const Button = <T extends ValidComponent = "button">(props: ButtonProps<T>) => { ... };
   ```

### Error Handling

- Use catch-all routes for 404: `[...404].tsx`
- Check `isServer` before accessing browser APIs
- Use optional chaining and nullish coalescing for safety

### Routing

- File-based routing in `src/routes/`
- Use `<A>` component from `@solidjs/router` for internal links
- External links use standard `<a>` tags

## UI Components

When creating new UI components with Kobalte:

1. Import primitives from `@kobalte/core`:

   ```typescript
   import { Root as ButtonPrimitive } from "@kobalte/core/button";
   ```

2. Create variants with CVA from `@/lib/cva`

3. Use `data-slot` attribute for component parts

4. Export both component and variants for flexibility

## Utility Functions

All formatting and helper functions should be placed in `src/lib/utils.ts`:

- `truncateAddress` - truncates wallet addresses for display
- `formatVolume` - formats numbers with compact notation (e.g., 1.2M)
- `formatPrice` - formats prices with currency symbol

When creating new formatting functions, add them to `utils.ts` rather than defining them in components.

## Key Dependencies

- `solid-js`, `@solidjs/start`, `@solidjs/router` - Core framework
- `@kobalte/core` - Headless UI components
- `cva`, `tailwind-merge` - Styling utilities
- `vinxi` - Build/dev server
- `eslint`, `typescript-eslint`, `eslint-plugin-solid` - Linting
- `prettier`, `prettier-plugin-tailwindcss` - Code formatting
