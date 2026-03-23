# C + Angular WebUI Project

A full-stack desktop application with a C backend using WebUI for native windows and an Angular frontend.

**Enterprise-Ready Features:**
- SQLite and DuckDB database support with migrations
- JWT authentication with password hashing
- Centralized error handling and logging
- Comprehensive testing (unit + E2E)
- Auto-updater mechanism
- DuckDB query builder with fluent API

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
│   ├── BACKEND_TESTING.md              # Backend testing guide
│   ├── TESTING.md                      # General testing infrastructure
│   ├── DUCKDB_INTEGRATION.md           # DuckDB integration guide
│   ├── DUCKDB_QUERY_BUILDER.md         # DuckDB query builder documentation
│   ├── ENTERPRISE_READINESS_AUDIT.md   # Enterprise readiness audit
│   ├── IMPLEMENTATION_SUMMARY.md       # Enterprise features implementation
│   ├── REFACTORING_SUMMARY.md          # Codebase refactoring summary
│   │
│   ├── backend/                        # Backend documentation
│   │   ├── README.md                   # Backend overview
│   │   ├── di-system.md                # Dependency Injection system
│   │   └── services/                   # Service documentation
│   │       ├── json.md                 # JSON service documentation
│   │       └── logger.md               # Logger service documentation
│   │
│   └── frontend/                       # Frontend documentation
│       ├── README.md                   # Frontend overview
│       ├── services/                   # Service documentation
│       │   ├── cache.md                # Cache service documentation
│       │   └── query.md                # Query service documentation
│       └── components/                 # Component documentation
│
├── src/                                # Backend C source code
│   ├── main.c                          # Application entry point
│   ├── app_module.h                    # Service registration (NgModule-like)
│   ├── migrations.h                    # Database migrations system
│   │
│   ├── di/                             # Dependency Injection System
│   │   ├── di.h                        # Single header DI library
│   │   ├── di_impl.c                   # DI implementation
│   │   └── README.md                   # DI documentation
│   │
│   ├── tests/                          # Backend test suites
│   │   ├── test_utils.h                # Test framework and utilities
│   │   ├── test_all.c                  # Comprehensive test runner
│   │   └── suites/                     # Individual test suites
│   │       ├── test_logger.c           # Logger service tests
│   │       ├── test_event.c            # Event service tests
│   │       ├── test_file.c             # File service tests
│   │       ├── test_timer.c            # Timer service tests
│   │       ├── test_json.c             # JSON service tests
│   │       ├── test_hash.c             # Hash service tests
│   │       ├── test_sqlite.c           # SQLite service tests
│   │       ├── test_auth.c             # Auth service tests
│   │       ├── test_error.c            # Error service tests
│   │       └── test_updater.c          # Updater service tests
│   │
│   └── services/                       # DI Services (15 total)
│       ├── Foundation Services (no dependencies)
│       │   ├── logger_service.h/c      # Logging with timestamps + file logging
│       │   ├── event_service.h/c       # Pub/sub event bus
│       │   ├── file_service.h/c        # File system operations
│       │   ├── timer_service.h/c       # Timing and scheduling
│       │   ├── json_service.h/c        # JSON parsing/generation
│       │   └── hash_service.h/c        # MD5, SHA1, SHA256, CRC32
│       │
│       ├── Dependent Services
│       │   ├── config_service.h/c      # Application configuration
│       │   └── http_service.h/c        # HTTP client
│       │
│       ├── Enterprise Services
│       │   ├── sqlite_service.h/c      # SQLite database + migrations
│       │   ├── duckdb_service.h/c      # DuckDB database integration
│       │   ├── duckdb_query_builder.h/c # DuckDB fluent query builder
│       │   ├── auth_service.h/c        # JWT authentication
│       │   ├── error_service.h/c       # Error tracking
│       │   └── updater_service.h/c     # Auto-updater
│       │
│       └── High-level Services
│           └── webui_service.h/c       # WebUI window management
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
│   ├── playwright.config.ts            # Playwright E2E config
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
│   │   ├── core/                       # Core services (19 total)
│   │   │   ├── api.service.ts          # API communication
│   │   │   ├── communication.service.ts # WebUI bridge
│   │   │   ├── http.service.ts         # HTTP client
│   │   │   ├── logger.service.ts       # Client-side logging
│   │   │   ├── theme.service.ts        # Theme management
│   │   │   ├── storage.service.ts      # localStorage + memory with TTL
│   │   │   ├── cache.service.ts        # LRU cache with eviction
│   │   │   ├── cache.service.test.ts   # Cache service tests
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
│   │   │   └── index.ts                # Barrel export
│   │   │
│   │   ├── app/services/               # Legacy services directory
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
│   ├── e2e/                            # E2E tests
│   │   └── home.spec.ts                # Home page E2E tests
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
    ├── test_all                        # Comprehensive test runner
    ├── test_logger                     # Logger test suite
    ├── test_event                      # Event test suite
    ├── test_file                       # File test suite
    ├── test_timer                      # Timer test suite
    ├── test_json                       # JSON test suite
    ├── test_hash                       # Hash test suite
    ├── test_sqlite                     # SQLite test suite
    ├── test_auth                       # Auth test suite
    ├── test_error                      # Error test suite
    ├── test_updater                    # Updater test suite
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

# Run backend tests
./run.sh test

# Run individual test suites
./build/test_logger
./build/test_sqlite
./build/test_auth
```

### Frontend Test Commands

```bash
# Run unit tests
cd frontend && bun test

# Run unit tests with coverage
cd frontend && bun test --coverage

# Run E2E tests
cd frontend && bunx playwright test

# Run E2E tests with UI
cd frontend && bunx playwright test --ui
```

---

## Architecture

### Backend (C + DI System + WebUI)

```
src/
├── main.c              → Entry point, DI initialization
├── app_module.h        → Service registration
├── migrations.h        → Database migrations
├── di/                 → Dependency Injection (stb-style)
│   ├── di.h           → Single header library
│   └── di_impl.c      → Implementation
└── services/          → Application services (15 total)
    ├── Foundation Layer (6 services)
    │   ├── logger_service → Logging
    │   ├── event_service  → Pub/Sub events
    │   ├── file_service   → File operations
    │   ├── timer_service  → Timing/scheduling
    │   ├── json_service   → JSON parsing/generation
    │   └── hash_service   → MD5, SHA1, SHA256, CRC32
    │
    ├── Dependent Layer (2 services)
    │   ├── config_service → Configuration
    │   └── http_service   → HTTP client
    │
    ├── Enterprise Layer (6 services)
    │   ├── sqlite_service       → SQLite database
    │   ├── duckdb_service       → DuckDB database
    │   ├── duckdb_query_builder → DuckDB fluent API
    │   ├── auth_service         → JWT authentication
    │   ├── error_service        → Error tracking
    │   └── updater_service      → Auto-updater
    │
    └── High-level Layer (1 service)
        └── webui_service → WebUI window management
```

### Service Dependencies

```
                    ┌─────────────────┐
                    │  WebuiService   │
                    │  (high-level)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐  ┌───────▼───────┐  ┌────────▼────────┐
│ ConfigService   │  │HttpService    │  │Enterprise Svcs  │
└────────┬────────┘  └───────┬───────┘  │(sqlite, auth,   │
         │                   │          │ duckdb, error,  │
         │              ┌────▼────┐     │ updater)        │
         │              │Logger   │     └────────┬────────┘
         │              │Event    │              │
         │              │File     │              │
         └──────────────▼─────────▼──────────────┘
                        Foundation Layer
              (Logger, Event, File, Timer, JSON, Hash)
```

### Frontend (Angular + Rspack)

```
frontend/src/
├── main.ts            → Bootstrap
├── index.html         → Entry HTML
├── views/             → Components (5 views)
│   ├── app.component  → Root component
│   ├── home/          → Home view
│   ├── auth/          → Auth view
│   ├── sqlite/        → Database view
│   ├── devtools/      → DevTools view
│   └── shared/        → Shared components
├── core/              → Services (19 total)
│   ├── Communication & API (3)
│   │   ├── api.service        → Backend API calls
│   │   ├── communication      → WebUI bridge
│   │   └── http.service       → HTTP client
│   │
│   ├── Storage & State (4)
│   │   ├── storage.service    → localStorage + TTL
│   │   ├── cache.service      → LRU cache
│   │   ├── query.service      → Data fetching
│   │   └── task.service       → Debounce/throttle
│   │
│   ├── UI & UX (5)
│   │   ├── theme.service      → Dark/light theme
│   │   ├── notification       → Toast notifications
│   │   ├── loading.service    → Loading indicators
│   │   ├── clipboard.service  → Clipboard
│   │   └── winbox.service     → Window management
│   │
│   └── Utilities (7)
│       ├── logger.service     → Client logging
│       ├── network-monitor    → Online/offline
│       ├── devtools.service   → Dev utilities
│       ├── global-error       → Error handling
│       ├── lucide-icons       → Icon provider
│       └── (other utilities)
├── models/            → Data models
├── types/             → TypeScript types
└── e2e/               → Playwright tests
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
4. Build test suites    → build/test_*
5. Launch application
```

### Build Commands (build.c)

| Command | Description |
|---------|-------------|
| `dev` | Build frontend + backend + run |
| `build` | Build only |
| `clean` | Remove build artifacts |
| `run` | Build and run |
| `rebuild` | Clean + build + run |
| `test` | Build and run all test suites |
| `help` | Show help |

---

## Backend Services

### Foundation Services (no dependencies)

| Service | File | Purpose |
|---------|------|---------|
| LoggerService | logger_service.h/c | Logging with timestamps, levels, file output |
| EventService | event_service.h/c | Pub/sub event bus |
| FileService | file_service.h/c | File system operations |
| TimerService | timer_service.h/c | Timing and scheduling |
| JsonService | json_service.h/c | JSON parsing/generation (recursive descent parser) |
| HashService | hash_service.h/c | MD5, SHA1, SHA256, CRC32 |

### Dependent Services

| Service | File | Dependencies | Purpose |
|---------|------|--------------|---------|
| ConfigService | config_service.h/c | Logger | Application configuration |
| HttpService | http_service.h/c | Logger | HTTP client (CivetWeb) |

### Enterprise Services

| Service | File | Dependencies | Purpose |
|---------|------|--------------|---------|
| SQLiteService | sqlite_service.h/c | Logger | SQLite database + migrations |
| DuckDBService | duckdb_service.h/c | Logger | DuckDB database integration |
| DuckDBQueryBuilder | duckdb_query_builder.h/c | DuckDBService | Fluent query builder API |
| AuthService | auth_service.h/c | Logger, Hash | JWT authentication, password hashing |
| ErrorService | error_service.h/c | Logger, File | Centralized error tracking |
| UpdaterService | updater_service.h/c | Logger, Http | Auto-updater mechanism |

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
| CacheService | LRU cache with eviction (tested) |
| QueryService | React Query-like data fetching |
| TaskService | Debounce, throttle, retry |

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
| LucideIconsProvider | Icon library provider |

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

### Root Documentation

| File | Description |
|------|-------------|
| README.md | This file (project overview) |
| AUDIT_SUMMARY.md | Service architecture documentation |
| docs/ | Comprehensive project documentation |

### Backend Documentation

| File | Description |
|------|-------------|
| docs/README.md | Documentation index |
| docs/BACKEND_TESTING.md | Backend testing guide (90+ test cases) |
| docs/TESTING.md | General testing infrastructure |
| docs/backend/README.md | Backend overview |
| docs/backend/di-system.md | DI system guide |
| docs/backend/services/ | Individual service docs |
| src/di/README.md | DI system technical documentation |

### Database Documentation

| File | Description |
|------|-------------|
| docs/DUCKDB_INTEGRATION.md | DuckDB integration guide |
| docs/DUCKDB_QUERY_BUILDER.md | DuckDB query builder API (fluent interface) |

### Enterprise Features Documentation

| File | Description |
|------|-------------|
| docs/ENTERPRISE_READINESS_AUDIT.md | Enterprise readiness audit |
| docs/IMPLEMENTATION_SUMMARY.md | Enterprise features implementation |
| docs/REFACTORING_SUMMARY.md | Codebase refactoring summary |

### Frontend Documentation

| File | Description |
|------|-------------|
| frontend/README.md | Frontend documentation |
| frontend/docs/00-README.md | Frontend docs index |
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
| Backend | SQLite | Relational database |
| Backend | DuckDB | Column-oriented OLAP database |
| Frontend | Angular v21 | UI framework |
| Frontend | TypeScript | Type-safe JavaScript |
| Frontend | WinBox | Window management |
| Frontend | Lucide Icons | Icon library |
| Frontend | Playwright | E2E testing |
| Frontend | Bun Test | Unit testing |

---

## Project Statistics

| Category | Count |
|----------|-------|
| Backend Services | 15 |
| Frontend Services | 19 |
| View Components | 5 |
| Backend Test Suites | 10 |
| Test Cases (Backend) | 94+ |
| E2E Tests | 10+ |
| Build Time (frontend) | ~15-20s |
| Build Time (backend) | ~2-3s |

---

## Enterprise Readiness

| Feature | Status | Description |
|---------|--------|-------------|
| Database (SQLite) | Implemented | SQLite with migrations |
| Database (DuckDB) | Implemented | DuckDB with query builder |
| Authentication | Implemented | JWT with password hashing |
| Error Handling | Implemented | Centralized tracking + file logging |
| Testing | Implemented | Unit + E2E tests |
| Auto Updates | Implemented | Background download + install |
| Logging | Implemented | Console + file with rotation |

### Database Services

#### SQLite Service
- Full database operations (CRUD)
- Prepared statements
- Transaction support
- Schema migrations system
- Query result handling

#### DuckDB Service
- Column-oriented OLAP database
- Analytical query optimization
- Same API as SQLite service

#### DuckDB Query Builder
- Fluent, chainable API
- SELECT, INSERT, UPDATE, DELETE
- WHERE clauses with AND/OR
- JOINs (INNER, LEFT, RIGHT, FULL)
- Aggregations (COUNT, SUM, AVG, MIN, MAX)
- ORDER BY, LIMIT, OFFSET
- Automatic SQL escaping

### Auth Service
- JWT token generation/validation
- Password hashing (SHA256 + salt)
- Password strength validation
- User registration/login
- Role-based access control (RBAC)
- Session management

### Error Service
- Centralized error tracking
- Severity levels (Low, Medium, High, Critical)
- Error categorization
- File persistence
- Error reporting callbacks

### Updater Service
- Update checking
- Background download
- Checksum verification
- Scheduled installation
- Progress callbacks

---

## License

- nob.h - Public Domain
- WebUI - MIT License
- Angular - MIT License
- Your code - Your choice
