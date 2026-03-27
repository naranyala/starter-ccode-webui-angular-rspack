# Angular Rspack Starter

A modern Angular 19 starter project configured with Rspack bundler and Bun runtime for improved build performance. Includes a comprehensive utilities library for common development tasks.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [Utilities Library](#utilities-library)
- [Configuration](#configuration)
- [Build System Comparison](#build-system-comparison)
- [Key Dependencies](#key-dependencies)
- [Code Quality](#code-quality)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project provides a starter template for Angular applications using:

- **Angular 19.2** - Latest Angular framework with all modern features
- **Rspack 1.3.5** - Fast Rust-based bundler (webpack-compatible)
- **Bun 1.3** - Fast JavaScript runtime and package manager
- **Biome** - Fast linter and formatter written in Rust

The setup maintains compatibility with traditional Angular CLI builds while offering faster build times through Rspack and Bun.

## Prerequisites

- Node.js v18+ (or use Bun as runtime)
- Bun v1.3+ (recommended for package management and running scripts)
- npm or yarn (alternative package managers)

Install Bun if not already installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Project Structure

```
starter-web-angular-rspack/
├── src/
│   ├── app/
│   │   ├── demo/                    # Demo page component
│   │   ├── devtools/                # DevTools panel component
│   │   ├── home/                    # Home page component
│   │   ├── shared/                  # Shared utilities
│   │   │   ├── services/            # Reusable services
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── clipboard.service.ts
│   │   │   │   ├── platform.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── devtools.service.ts
│   │   │   │   └── winbox-manager.service.ts
│   │   │   ├── utils/               # Utility functions
│   │   │   │   ├── format.utils.ts
│   │   │   │   ├── string.utils.ts
│   │   │   │   ├── validation.utils.ts
│   │   │   │   ├── time.utils.ts
│   │   │   │   ├── array.utils.ts
│   │   │   │   └── object.utils.ts
│   │   │   ├── pipes/               # Angular pipes
│   │   │   │   ├── format.pipes.ts
│   │   │   │   └── string.pipes.ts
│   │   │   └── directives/          # Angular directives
│   │   │       └── index.ts
│   │   ├── app-routing.module.ts    # Routing configuration
│   │   ├── app.component.ts         # Root component
│   │   └── app.module.ts            # App module
│   ├── environments/
│   │   ├── environment.ts           # Development environment
│   │   └── environment.prod.ts      # Production environment
│   ├── assets/                      # Static assets
│   ├── favicon.ico
│   ├── index.html                   # Main HTML template
│   ├── main.ts                      # Application entry point
│   ├── polyfills.ts                 # Polyfills
│   ├── styles.css                   # Global styles
│   └── test.ts                      # Test setup
├── docs/
│   ├── README.md                    # Documentation index
│   ├── 01-getting-started.md        # Getting started guide
│   ├── 02-architecture.md           # Architecture documentation
│   ├── 03-winbox-panel.md           # WinBox panel guide
│   ├── 04-components.md             # Components documentation
│   ├── 05-styling.md                # Styling guide
│   ├── 06-build-deploy.md           # Build and deployment
│   ├── 07-improvements.md           # Future improvements
│   ├── 08-devtools.md               # DevTools guide
│   └── 09-utilities.md              # Utilities documentation
├── scripts/
│   ├── check-port.js                # Port availability checker
│   ├── dev-with-port-finder.js      # Dev server with auto port finding
│   └── dev.sh                       # Shell script for dev with port handling
├── e2e/                             # End-to-end tests
├── angular.json                     # Angular CLI configuration
├── biome.json                       # Biome linter configuration
├── bunfig.toml                      # Bun runtime configuration
├── package.json                     # Dependencies and scripts
├── rspack.config.js                 # Rspack bundler configuration
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json                # App TypeScript config
├── tsconfig.spec.json               # Spec TypeScript config
└── README.md                        # This file
```

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd starter-web-angular-rspack
bun install
```

### Development Server

Start the development server with Rspack:

```bash
bun run dev
# or
bun run serve:rspack
```

The application will be available at `http://localhost:4200`.

### Production Build

Create a production build with Rspack:

```bash
bun run build:rspack
```

Output will be in the `dist/` directory.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run start` | Start Angular CLI dev server (webpack) |
| `bun run dev` | Start Rspack dev server with HMR |
| `bun run serve:rspack` | Start Rspack dev server |
| `bun run build` | Production build with Angular CLI |
| `bun run build:rspack` | Production build with Rspack |
| `bun run test` | Run unit tests with Karma |
| `bun run lint` | Check code with Biome |
| `bun run lint:fix` | Auto-fix linting issues with Biome |
| `bun run format` | Check formatting with Biome |
| `bun run format:fix` | Auto-fix formatting with Biome |
| `bun run e2e` | Run end-to-end tests |

## Features

### Core Features

- **Angular 19** - Latest Angular with signals and standalone components
- **Rspack Bundler** - 10-100x faster builds than webpack
- **Bun Runtime** - Fast package installation and script execution
- **TypeScript** - Full type safety with latest TypeScript
- **SCSS Support** - Advanced CSS preprocessing

### Development Features

- **Hot Module Replacement** - Instant updates during development
- **Source Maps** - Debug original TypeScript code
- **Code Splitting** - Automatic chunk optimization
- **Tree Shaking** - Remove unused code automatically

### Code Quality

- **Biome** - Fast linting and formatting (Rust-based)
- **TypeScript Strict Mode** - Catch errors at compile time
- **EditorConfig** - Consistent coding style across editors
- **Husky** - Git hooks for pre-commit checks

### UI Components

- **DevTools Panel** - Collapsible bottom panel for debugging
  - Info tab: Application metadata
  - State tab: Component state monitoring
  - Events tab: Event logging
  - Settings tab: Configuration options

## Utilities Library

This project includes a comprehensive utilities library for common development tasks.

### Services

| Service | Description |
|---------|-------------|
| `StorageService` | Reactive localStorage/sessionStorage with signals |
| `ClipboardService` | Copy/paste with fallbacks and notifications |
| `PlatformService` | Platform/device detection and viewport tracking |
| `NotificationService` | Toast notification system |

### Utility Functions

| Module | Description |
|--------|-------------|
| `format.utils` | Bytes, duration, currency, number formatting |
| `string.utils` | Truncate, slugify, case conversion, validation |
| `validation.utils` | Form validators (required, email, password, etc.) |
| `time.utils` | Date formatting, relative time, date manipulation |
| `array.utils` | Unique, groupBy, sortBy, chunk, sum, average |
| `object.utils` | Get/set nested props, pick/omit, deep clone/merge |

### Pipes

| Pipe | Description |
|------|-------------|
| `formatBytes` | Format file sizes (1.5 KB, 2.3 MB) |
| `formatDuration` | Format milliseconds (1m 30s) |
| `formatCurrency` | Format currency (€19.99) |
| `formatPercent` | Format percentage (87.5%) |
| `formatCompact` | Compact notation (1.5K, 2.3M) |
| `formatDate` | Format dates with various formats |
| `formatRelativeTime` | Relative time (2 hours ago) |
| `truncate` | Truncate strings with ellipsis |
| `slugify` | URL-friendly slugs |
| `capitalize` / `titleCase` | Case transformations |

### Directives

| Directive | Description |
|-----------|-------------|
| `clickOutside` | Emit when clicking outside element |
| `longPress` | Detect long press gestures |
| `copyToClipboard` | Copy text on click |
| `autoFocus` | Auto-focus elements |
| `inputDebounce` | Debounce input events |
| `resizeObserver` | Observe element resize |
| `intersectionObserver` | Viewport intersection detection |
| `lazySrc` | Lazy load images |

### Quick Usage Example

```typescript
// Import services
import { StorageService, NotificationService } from './shared/services';
import { PlatformService } from './shared/services';

// Import utilities
import { formatBytes, isEmail, slugify } from './shared/utils';

// Import pipes
import { FormatPipes, StringPipes } from './shared/pipes';

// Import directives
import { ClickOutsideDirective, InputDebounceDirective } from './shared/directives';

@Component({
  standalone: true,
  imports: [...FormatPipes, ...StringPipes, ClickOutsideDirective],
  template: `
    <p>Size: {{ fileSize | formatBytes }}</p>
    <p>Title: {{ title | slugify }}</p>
    <div (clickOutside)="close()">...</div>
  `,
})
export class MyComponent {
  constructor(
    private storage: StorageService,
    private notify: NotificationService,
  ) {}
}
```

**Full Documentation:** [docs/09-utilities.md](./docs/09-utilities.md)

## Configuration

### Rspack Configuration

The `rspack.config.js` file configures the Rspack bundler:

- Uses `esbuild-loader` for fast TypeScript compilation
- Configures `raw-loader` for HTML templates
- Processes CSS/SCSS with standard loaders
- Generates HTML with `html-rspack-plugin`
- Supports hot module replacement (HMR)

### Bun Configuration

The `bunfig.toml` file configures the Bun runtime:

- Defines script aliases
- Configures runtime behavior

### TypeScript Configuration

- `tsconfig.json` - Base TypeScript configuration for Angular 19
- `tsconfig.app.json` - Application-specific TypeScript settings
- `tsconfig.spec.json` - Test-specific TypeScript settings

### Angular CLI Configuration

The `angular.json` file maintains compatibility with traditional Angular CLI commands and webpack-based builds.

## Build System Comparison

### Rspack + Bun (Recommended for Development)

- Faster cold starts
- Faster incremental builds
- Lower memory usage
- Hot module replacement enabled

### Angular CLI + Webpack (Traditional)

- Full Angular CLI feature set
- More plugins and loaders available
- Better for complex custom configurations

## Key Dependencies

### Runtime Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| @angular/* | 19.2.0 | Angular framework packages |
| rxjs | 7.8.x | Reactive Extensions for JavaScript |
| zone.js | 0.15.x | Zone.js for change detection |
| tslib | 2.6.x | TypeScript runtime library |

### Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| @rspack/core | 1.3.5 | Rspack bundler |
| @rspack/cli | 1.3.5 | Rspack CLI tools |
| @biomejs/biome | 2.4.2 | Linter and formatter |
| esbuild-loader | 4.4.2 | Fast TypeScript compilation |
| sass | 1.97.x | SCSS/SASS preprocessor |
| karma | 6.4.x | Test runner |
| jasmine | 5.1.x | Testing framework |

## Code Quality

### Linting

This project uses Biome for linting and formatting, which is significantly faster than ESLint and Prettier.

Check for linting issues:

```bash
bun run lint
```

Auto-fix issues:

```bash
bun run lint:fix
```

### Formatting

Check formatting:

```bash
bun run format
```

Auto-fix formatting:

```bash
bun run format:fix
```

Biome configuration is in `biome.json`.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/01-getting-started.md) | Installation and first steps |
| [Architecture](./docs/02-architecture.md) | Application structure and patterns |
| [WinBox Panel](./docs/03-winbox-panel.md) | Window management system |
| [Components](./docs/04-components.md) | Component documentation |
| [Styling](./docs/05-styling.md) | CSS and theming guide |
| [Build & Deploy](./docs/06-build-deploy.md) | Build and deployment guide |
| [Improvements](./docs/07-improvements.md) | Future enhancements |

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

### Rspack-Specific Issues

If Rspack build fails but webpack succeeds:

1. Check `rspack.config.js` for loader compatibility
2. Ensure all required loaders are installed
3. Compare with `angular.json` webpack configuration

### Performance Issues

For large bundle sizes:

1. Enable production mode in Angular
2. Implement lazy loading for routes
3. Analyze bundle with `bun run build:rspack --analyze`

## Contributing

Contributions are welcome! Please follow these guidelines:

### Reporting Issues

- Use GitHub Issues to report bugs and request features
- Include steps to reproduce the issue
- Provide environment details (OS, Node version, Bun version)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `bun run lint:fix` before committing
- Run `bun run format:fix` to ensure consistent formatting
- Write tests for new features

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## License

This project is provided as-is for educational and starter purposes.

## Acknowledgments

- [Angular Team](https://angular.io/) for the amazing framework
- [Rspack Team](https://rspack.dev/) for the fast bundler
- [Bun Team](https://bun.sh/) for the fast runtime
- [Biome Team](https://biomejs.dev/) for the fast linter
