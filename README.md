# DeepBook Margin UI

A SolidJS + SolidStart application for DeepBook margin trading.

## Prerequisites

- **Node.js**: >=22
- **Bun**: Latest version ([install Bun](https://bun.sh))

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development

Start the development server:

```bash
bun dev
```

Or start the server and open the app in a new browser tab:

```bash
bun dev -- --open
```

## Building

Build the application for production:

```bash
bun build
```

Start the production server:

```bash
bun start
```

## Code Quality

### Linting

Run ESLint to check for code quality issues:

```bash
bun lint
```

Auto-fix linting issues:

```bash
bun lint:fix
```

### Formatting

Format all files with Prettier:

```bash
bun format
```

Check formatting without making changes:

```bash
bun format:check
```

## Tech Stack

- **Framework**: SolidJS + SolidStart (SSR-enabled)
- **Build Tool**: Vinxi (uses Vite under the hood)
- **Package Manager**: Bun
- **Styling**: Tailwind CSS v4
- **UI Components**: Kobalte (headless primitives)
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint
- **Formatting**: Prettier

## Project Structure

```
src/
├── app.tsx              # Root app with Router and Suspense
├── app.css              # Tailwind v4 config + design tokens
├── routes/              # File-based routing
│   ├── index.tsx       # Home page (/)
│   └── [...404].tsx    # 404 catch-all
├── components/          # React components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── lib/                # Utilities
└── constants/          # Constants
```

## License

See [LICENSE](LICENSE) file for details.
