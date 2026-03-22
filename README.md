# C + Angular WebUI Project

A full-stack desktop application with a C backend using WebUI for native windows and an Angular frontend.

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Build Pipeline](#build-pipeline)
- [Backend Services](#backend-services)
- [Frontend Services](#frontend-services)
- [Documentation](#documentation)
- [Key Technologies](#key-technologies)

---

## Project Structure

```
.
├── README.md                           # This file
├── AUDIT_SUMMARY.md                    # Service architecture documentation
├── .gitignore                          # Git ignore rules
├── run.sh                              # Wrapper script for build commands
├── nob.h                               # Build system header (nob.h v3.7.0)
├── build.c                             # Build script with multiple commands
│
├── docs/                               # Project documentation
│   ├── README.md                       # Documentation index
│   ├── backend/                        # Backend documentation
│   │   ├── README.md                   # Backend overview
│   │   ├── di-system.md                # Dependency Injection system
│   │   └── services/                   # Service documentation
│   └── frontend/                       # Frontend documentation
│       ├── README.md                   # Frontend overview
│       ├── services/                   # Service documentation
│       └── components/                 # Component documentation
│
├── src/                                # Backend C source code
│   ├── main.c                          # Application entry point
│   ├── app_module.h                    # Service registration (NgModule-like)
│   │
│   ├── di/                             # Dependency Injection System
│   │   ├── di.h                        # Single header DI library
│   │   ├── di_impl.c                   # DI implementation
│   │   └── README.md                   # DI documentation
│   │
│   └── services/                       # DI Services (9 total)
│       ├── logger_service.h/c          # Logging with timestamps
│       ├── config_service.h/c          # Application configuration
│       ├── webui_service.h/c           # WebUI window management
│       ├── event_service.h/c           # Pub/sub event bus
│       ├── file_service.h/c            # File system operations
│       ├── timer_service.h/c           # Timing and scheduling
│       ├── json_service.h/c            # JSON parsing/generation
│       ├── hash_service.h/c            # MD5, SHA1, SHA256, CRC32
│       └── http_service.h/c            # HTTP client (stub)
│
├── frontend/                           # Angular frontend application
│   ├── package.json                    # Node.js dependencies
│   ├── package-lock.json               # NPM lockfile
│   ├── bun.lock                        # Bun lockfile
│   ├── bunfig.toml                     # Bun configuration
│   ├── biome.json                      # Biome linter config
│   ├── tsconfig.json                   # TypeScript config
│   ├── tsconfig.app.json               # TypeScript app config
│   ├── rspack.config.js                # Rspack bundler config
│   ├── angular.json                    # Angular CLI config
│   ├── README.md                       # Frontend documentation
│   ├── ANGULAR_MODERN_FEATURES.md      # Modern Angular features
│   ├── ANGULAR_MODERNIZATION_PLAN.md   # Modernization plan
│   │
│   ├── docs/                           # Frontend documentation
│   │   ├── 00-README.md                # Docs index
│   │   └── 01-DI_EVALUATION.md         # DI system evaluation
│   │
│   ├── src/                            # Frontend source
│   │   ├── main.ts                     # Frontend entry point
│   │   ├── index.html                  # HTML template
│   │   ├── styles.css                  # Global styles
│   │   ├── favicon.ico                 # Favicon
│   │   ├── winbox-loader.ts            # WinBox window loader
│   │   │
│   │   ├── views/                      # View components
│   │   │   ├── app.component.ts/html/css   # Root component
│   │   │   ├── home/                       # Home view
│   │   │   │   └── home.component.ts
│   │   │   ├── auth/                       # Authentication view
│   │   │   │   └── auth.component.ts
│   │   │   ├── sqlite/                     # SQLite CRUD view
│   │   │   │   └── sqlite.component.ts
│   │   │   ├── devtools/                   # DevTools view
│   │   │   │   └── devtools.component.ts
│   │   │   └── shared/                     # Shared components
│   │   │
│   │   ├── core/                       # Core services (16 total)
│   │   │   ├── api.service.ts          # API communication
│   │   │   ├── communication.service.ts # WebUI bridge
│   │   │   ├── http.service.ts         # HTTP client
│   │   │   ├── logger.service.ts       # Client-side logging
│   │   │   ├── theme.service.ts        # Theme management
│   │   │   ├── storage.service.ts      # localStorage + memory with TTL
│   │   │   ├── cache.service.ts        # LRU cache with eviction
│   │   │   ├── query.service.ts        # React Query-like data fetching
│   │   │   ├── task.service.ts         # Debounce, throttle, retry
│   │   │   ├── notification.service.ts # Toast notifications
│   │   │   ├── loading.service.ts      # Loading indicators
│   │   │   ├── clipboard.service.ts    # Clipboard operations
│   │   │   ├── winbox.service.ts       # WinBox window manager
│   │   │   ├── network-monitor.service.ts # Online/offline detection
│   │   │   ├── devtools.service.ts     # Development utilities
│   │   │   ├── global-error.service.ts # Global error handling
│   │   │   ├── lucide-icons.provider.ts # Icon library provider
│   │   │   ├── index.ts                # Barrel export
│   │   │   └── webui/                  # WebUI integration
│   │   │
│   │   ├── models/                     # TypeScript models
│   │   │   ├── card.model.ts           # Card data model
│   │   │   ├── log.model.ts            # Log entry model
│   │   │   ├── window.model.ts         # Window model
│   │   │   └── index.ts                # Barrel export
│   │   │
│   │   ├── types/                      # TypeScript types
│   │   │   ├── error.types.ts          # Error types
│   │   │   ├── winbox.d.ts             # WinBox type definitions
│   │   │   └── index.ts                # Barrel export
│   │   │
│   │   ├── environments/               # Environment configs
│   │   │   └── environment.ts          # Environment variables
│   │   │
│   │   ├── assets/                     # Static assets
│   │   └── integration/                # Integration tests
│   │
│   └── dist/                           # Build output (generated)
│       └── browser/                    # Browser build
│           ├── index.html              # Built HTML
│           ├── main-*.js               # Bundled JavaScript
│           ├── styles-*.css            # Bundled CSS
│           └── polyfills-*.js          # Polyfills
│
├── thirdparty/                         # Third-party libraries
│   ├── webui/                          # WebUI library
│   │   ├── include/                    # WebUI headers
│   │   ├── src/                        # WebUI source
│   │   ├── examples/                   # WebUI examples
│   │   └── bridge/                     # WebUI bridge utilities
│   ├── webview/                        # WebView library
│   ├── duckdb_cli-linux-amd64/         # DuckDB CLI
│   ├── libduckdb-linux-amd64/          # DuckDB library
│   └── static-duckdb-libs-linux-amd64/ # DuckDB static libs
│
└── build/                              # Build output (generated)
    ├── main                            # Compiled binary
    ├── libwebui-2.a                    # WebUI static library
    ├── webui.o                         # WebUI object file
    └── civetweb.o                      # CivetWeb object file
```

---

## Quick Start

### Prerequisites

- GCC compiler
- Bun (https://bun.sh/) for frontend builds

### Build Commands

```bash
# Show help
./run.sh

# Build and run (default)
./run.sh dev

# Build only (no run)
./run.sh build

# Clean build artifacts
./run.sh clean

# Clean and rebuild
./run.sh rebuild
```

---

## Architecture

### Backend (C + DI System + WebUI)

```
src/
├── main.c              → Entry point, DI initialization
├── app_module.h        → Service registration
├── di/                 → Dependency Injection (stb-style)
│   ├── di.h           → Single header library
│   └── di_impl.c      → Implementation
└── services/          → Application services
    ├── logger_service → Logging
    ├── event_service  → Pub/Sub events
    ├── file_service   → File operations
    ├── timer_service  → Timing/scheduling
    ├── config_service → Configuration (→ Logger)
    ├── json_service   → JSON parsing/generation
    ├── hash_service   → MD5, SHA1, SHA256, CRC32
    ├── http_service   → HTTP client (stub)
    └── webui_service  → WebUI wrapper (→ Logger, Config)
```

### Service Dependencies

```
                    WebuiService
                   (high-level)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
   ConfigService   HttpService    JsonService
         │
         └───────────────┬───────────────┐
                         │
              ┌──────────▼──────────┐
              │  Foundation Layer   │
              │ Logger | Event      │
              │ File   | Timer      │
              │ JSON   | Hash       │
              └─────────────────────┘
```

### Frontend (Angular + Rspack)

```
frontend/src/
├── main.ts            → Bootstrap
├── index.html         → Entry HTML
├── views/             → Components
│   ├── app.component  → Root component
│   ├── home/          → Home view
│   ├── auth/          → Auth view
│   ├── sqlite/        → Database view
│   └── devtools/      → DevTools view
├── core/              → Services
│   ├── api.service    → Backend API
│   ├── logger.service → Logging
│   ├── theme.service  → Theming
│   ├── storage.service → Storage with TTL
│   ├── cache.service  → LRU cache
│   ├── query.service  → Data fetching
│   ├── task.service   → Debounce/throttle
│   └── winbox.service → Window management
├── models/            → Data models
└── types/             → TypeScript types
```

---

## Build Pipeline

### nob.h Build System

The project uses nob.h v3.7.0, a single-header C build library.

**Build Flow:**

```
build.c (build script)
    ↓
nob.h (build library)
    ↓
1. Build Angular frontend → frontend/dist/browser/
2. Build WebUI static lib → build/libwebui-2.a
3. Compile C backend    → build/main
4. Launch application
```

### Build Commands (build.c)

| Command | Description |
|---------|-------------|
| `dev` | Build frontend + backend + run |
| `build` | Build only |
| `clean` | Remove build artifacts |
| `run` | Build and run |
| `rebuild` | Clean + build + run |
| `help` | Show help |

---

## Backend Services

### Foundation Services (no dependencies)

| Service | File | Purpose |
|---------|------|---------|
| LoggerService | logger_service.h/c | Logging with timestamps and levels |
| EventService | event_service.h/c | Pub/sub event bus |
| FileService | file_service.h/c | File system operations |
| TimerService | timer_service.h/c | Timing and scheduling |
| JsonService | json_service.h/c | JSON parsing/generation |
| HashService | hash_service.h/c | MD5, SHA1, SHA256, CRC32 |

### Dependent Services

| Service | File | Dependencies | Purpose |
|---------|------|--------------|---------|
| ConfigService | config_service.h/c | Logger | Application configuration |
| HttpService | http_service.h/c | Logger | HTTP client |

### High-level Services

| Service | File | Dependencies | Purpose |
|---------|------|--------------|---------|
| WebuiService | webui_service.h/c | Logger, Config | WebUI window management |

### Dependency Injection

The backend uses an stb-style single-header DI system:

```c
// Define service
typedef struct LoggerService {
    DI_Service base;
    const char* prefix;
    bool debug_enabled;
} LoggerService;

DI_DECLARE_SERVICE(LoggerService, logger_service);

// Initialize
DI_SERVICE_INIT(LoggerService, logger_service) {
    self->prefix = "LOG";
    self->debug_enabled = true;
    return DI_OK;
}

// Use
LoggerService* logger = logger_service_inject();
logger_log(logger, "INFO", "Hello, World!");
```

See `src/di/README.md` for full documentation.

---

## Frontend Services

### Communication & API

| Service | Purpose |
|---------|---------|
| ApiService | Backend API calls with signals |
| CommunicationService | WebUI bridge communication |
| HttpService | HTTP client wrapper |

### Storage & State

| Service | Purpose |
|---------|---------|
| StorageService | localStorage + memory with TTL |
| CacheService | LRU cache with eviction |
| QueryService | React Query-like data fetching |

### UI & UX

| Service | Purpose |
|---------|---------|
| ThemeService | Dark/light theme |
| NotificationService | Toast notifications |
| LoadingService | Loading indicators |
| ClipboardService | Clipboard operations |
| WinBoxService | Window management |

### Utilities

| Service | Purpose |
|---------|---------|
| LoggerService | Client-side logging |
| NetworkMonitorService | Online/offline detection |
| DevToolsService | Development utilities |
| GlobalErrorService | Global error handling |
| TaskService | Debounce, throttle, retry |

### Service Signals Pattern

All services use Angular signals for reactive state management:

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  private readonly loading = signal(false);
  private readonly data = signal<T | null>(null);

  readonly isLoading = this.loading.asReadonly();
  readonly data$ = this.data.asReadonly();
  readonly hasData = computed(() => this.data() !== null);
}
```

---

## Documentation

### Project Documentation

| File | Description |
|------|-------------|
| README.md | This file (project overview) |
| AUDIT_SUMMARY.md | Service architecture documentation |
| docs/ | Comprehensive project documentation |

### Backend Documentation

| File | Description |
|------|-------------|
| src/di/README.md | DI system documentation |
| docs/backend/README.md | Backend overview |
| docs/backend/di-system.md | DI system guide |
| docs/backend/services/ | Individual service docs |

### Frontend Documentation

| File | Description |
|------|-------------|
| frontend/README.md | Frontend documentation |
| frontend/docs/00-README.md | Docs index |
| frontend/docs/01-DI_EVALUATION.md | DI system evaluation |
| frontend/ANGULAR_MODERN_FEATURES.md | Modern Angular features |
| frontend/ANGULAR_MODERNIZATION_PLAN.md | Modernization plan |

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Build | nob.h | C build automation |
| Build | Bun | Frontend package manager |
| Build | Rspack | Frontend bundler |
| Backend | C (C99) | Application logic |
| Backend | DI System | Dependency injection |
| Backend | WebUI | Native WebView windows |
| Backend | CivetWeb | Embedded web server |
| Frontend | Angular v21 | UI framework |
| Frontend | TypeScript | Type-safe JavaScript |
| Frontend | WinBox | Window management |
| Frontend | Lucide Icons | Icon library |

---

## Project Statistics

| Category | Count |
|----------|-------|
| Backend Services | 9 |
| Frontend Services | 16 |
| View Components | 5 |
| Build Time (frontend) | ~15-20s |
| Build Time (backend) | ~2-3s |

---

## License

- nob.h - Public Domain
- WebUI - MIT License
- Angular - MIT License
- Your code - Your choice
