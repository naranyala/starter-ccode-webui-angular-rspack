# Angular + Rspack + Bun Setup

This project demonstrates Angular 19 working with the Rspack bundler and Bun JavaScript runtime. Includes a comprehensive utilities library and development tools.

## Quick Start

### Development Server
```bash
bun run serve:rspack
# or
bun run dev  # With automatic port handling
```

### Production Build
```bash
bun run build:rspack
```

### Traditional Angular CLI (Webpack)
```bash
bun run start    # Angular CLI dev server
bun run build    # Angular CLI production build
```

## Configuration Files

- `rspack.config.js` - Rspack bundler configuration
- `bunfig.toml` - Bun runtime configuration
- `tsconfig.json` - TypeScript configuration for Angular 19

## Key Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| @angular/* | 19.2 | Latest Angular framework |
| @rspack/core | 1.3.5 | Fast Rust-based bundler |
| @rspack/cli | 1.3.5 | Rspack CLI tools |
| bun | 1.3+ | Fast JavaScript runtime |
| esbuild-loader | 4.4.2 | Fast TypeScript compilation |
| @biomejs/biome | 2.4.2 | Linter and formatter |

## Project Features

### Core Technologies
- **Angular 19** - Signals, standalone components, latest features
- **Rspack** - 10-100x faster builds than webpack
- **Bun** - Fast package installation and script execution
- **TypeScript** - Full type safety

### Development Tools
- **Hot Module Replacement** - Instant updates during development
- **Port Auto-Finding** - Automatically finds available port if 4201 is busy
- **Source Maps** - Debug original TypeScript code
- **Code Splitting** - Automatic chunk optimization

### Utilities Library
- **Services**: Storage, Clipboard, Platform, Notification
- **Functions**: Format, String, Validation, Time, Array, Object utilities
- **Pipes**: formatBytes, formatDate, truncate, slugify, etc.
- **Directives**: clickOutside, longPress, lazySrc, etc.

### UI Components
- **DevTools Panel** - 8-tab debugging panel (Overview, Routes, Performance, Memory, Errors, Resources, Storage, Browser)
- **WinBox Windows** - Window management system
- **Responsive Cards** - Technology showcase with search

## How It Works

This setup uses a manual Rspack configuration that:
1. Uses `esbuild-loader` to compile TypeScript with Angular decorators
2. Loads HTML templates with `raw-loader`
3. Processes CSS/SCSS with standard loaders
4. Generates HTML with `html-rspack-plugin`
5. Runs entirely on Bun runtime for maximum performance

## Available Scripts

### Development
```bash
bun run dev              # Dev server with auto port finding
bun run dev:raw          # Raw Rspack dev server
bun run dev:check        # Interactive dev with port conflict handling
bun run dev:force        # Force kill process on port 4201
```

### Building
```bash
bun run build:rspack     # Production build with Rspack
bun run build            # Production build with Angular CLI
```

### Testing
```bash
bun run test             # Run unit tests
bun run test:watch       # Watch mode
bun run e2e              # End-to-end tests
```

### Code Quality
```bash
bun run lint             # Auto-fix linting issues
bun run lint:check       # Check only
bun run format           # Format code
bun run format:check     # Check formatting
```

## Port Handling

The `bun run dev` command includes automatic port handling:
- Checks if port 4201 is available
- If busy, automatically finds next available port (4202, 4203, etc.)
- Displays which port is being used

```bash
# Normal usage - auto-finds port
bun run dev

# Force kill existing process on 4201
bun run dev:force

# Use specific port
PORT=4205 bun run dev
```

## Notes

- The bundle size is large (~820KB) because it includes the full Angular runtime
- For production, consider enabling production mode and lazy loading
- HMR (Hot Module Replacement) works with `bun run dev`
- The Okta authentication is configured but may need adjustment for your environment

## Troubleshooting

### Clean Installation
If you encounter dependency issues:
```bash
rm -rf node_modules bun.lock
bun install
```

### Clear Build Cache
If builds are failing:
```bash
rm -rf dist
bun run build:rspack
```

### Check Versions
Verify tool versions:
```bash
bun --version    # Should be 1.3+
node --version   # Should be v18+
```

### Port Conflicts
If port 4201 is busy:
```bash
# Auto-find available port
bun run dev

# Or force kill existing process
bun run dev:force

# Or use custom port
PORT=4205 bun run dev
```

### Rspack-Specific Issues
If Rspack build fails but webpack succeeds:
1. Check `rspack.config.js` for loader compatibility
2. Ensure all required loaders are installed
3. Compare with `angular.json` webpack configuration

## Documentation

Full documentation is available in the `docs/` folder:

- [Getting Started](./docs/01-getting-started.md)
- [Architecture](./docs/02-architecture.md)
- [WinBox Panel](./docs/03-winbox-panel.md)
- [Components](./docs/04-components.md)
- [Styling](./docs/05-styling.md)
- [Build & Deploy](./docs/06-build-deploy.md)
- [Improvements](./docs/07-improvements.md)
- [DevTools](./docs/08-devtools.md)
- [Utilities](./docs/09-utilities.md)
