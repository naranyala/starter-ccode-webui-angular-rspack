# C + Angular WebUI Project

A full-stack desktop application with a C backend using WebUI for native windows and an Angular frontend with Rspack bundler.

## Features

- SQLite and DuckDB database support with migrations
- JWT authentication with password hashing
- CRUD API handlers for database operations
- Centralized error handling and logging
- Dependency injection system (stb-style)
- Comprehensive testing infrastructure
- Auto-updater mechanism
- Query builder with fluent API
- WebUI bridge for frontend-backend communication

## Project Structure

```
.
|-- README.md                         # This file
|-- AUDIT_SUMMARY.md                  # Service architecture documentation
|-- run.sh                           # Wrapper script for build commands
|-- nob.h                            # Build system header (nob.h v3.7.0)
|-- build.c                          # Build script with multiple commands
|
|-- docs/                            # Project documentation
|   |-- README.md                    # Documentation index
|   |-- BACKEND_TESTING.md           # Backend testing guide
|   |-- TESTING.md                  # General testing infrastructure
|   |-- DUCKDB_INTEGRATION.md       # DuckDB integration guide
|   |-- DUCKDB_QUERY_BUILDER.md     # DuckDB query builder documentation
|   |-- ENTERPRISE_READINESS_AUDIT.md # Enterprise readiness audit
|   |-- IMPLEMENTATION_SUMMARY.md    # Enterprise features implementation
|   |-- REFACTORING_SUMMARY.md       # Codebase refactoring summary
|   |-- DOCUMENTATION_GAP_ANALYSIS.md # Documentation analysis
|   |
|   |-- backend/                     # Backend documentation
|   |   |-- README.md                # Backend overview
|   |   |-- di-system.md             # Dependency Injection system
|   |   |-- services/                # Service documentation
|   |       |-- logger.md           # Logger service
|   |       |-- sqlite.md           # SQLite service
|   |       |-- duckdb.md           # DuckDB service
|   |       |-- auth.md             # Authentication service
|   |       |-- webui.md            # WebUI service
|   |       |-- http.md             # HTTP service
|   |       |-- json.md             # JSON service
|   |       |-- hash.md             # Hash service
|   |       |-- file.md             # File service
|   |       |-- timer.md            # Timer service
|   |       |-- error.md            # Error service
|   |       |-- updater.md          # Updater service
|   |       |-- config.md           # Config service
|   |       |-- event.md            # Event service
|   |       |-- crud-api.md         # CRUD API handlers
|   |       |-- database-service.md # Database abstraction
|   |       |-- sql-query-builder.md # SQL query builder
|   |
|   |-- frontend/                    # Frontend documentation
|       |-- README.md               # Frontend overview
|       |-- angular-architecture.md  # Angular architecture
|       |-- services/              # Service documentation
|       |-- components/            # Component documentation
|
|-- src/                             # Backend C source code
|   |-- main.c                      # Application entry point
|   |-- app_module.h                # Service registration
|   |-- migrations.h                # Database migrations (SQLite)
|
|   |-- di/                         # Dependency Injection System
|   |   |-- di.h                   # Single header DI library
|   |   |-- di_impl.c              # DI implementation
|
|   |-- tests/                       # Backend test suites
|   |   |-- test_utils.h           # Test framework utilities
|   |   |-- test_all.c            # Comprehensive test runner
|   |   |-- test_enterprise.c     # Enterprise tests
|   |   |-- test_foundation.c     # Foundation tests
|   |   |-- test_runner.c          # Test runner
|   |   |-- suites/                # Individual test suites
|   |       |-- test_logger.c     # Logger service tests
|   |       |-- test_event.c      # Event service tests
|   |       |-- test_file.c       # File service tests
|   |       |-- test_timer.c      # Timer service tests
|   |       |-- test_json.c       # JSON service tests
|   |       |-- test_hash.c       # Hash service tests
|   |       |-- test_sqlite.c     # SQLite service tests
|   |       |-- test_auth.c       # Auth service tests
|   |       |-- test_error.c      # Error service tests
|   |       |-- test_updater.c    # Updater service tests
|
|   |-- services/                    # DI Services (16 total)
|       |-- Foundation Services (6)
|       |   |-- logger_service.h/c   # Logging with timestamps
|       |   |-- event_service.h/c    # Pub/sub event bus
|       |   |-- file_service.h/c     # File system operations
|       |   |-- timer_service.h/c    # Timing and scheduling
|       |   |-- json_service.h/c     # JSON parsing/generation
|       |   |-- hash_service.h/c     # MD5, SHA1, SHA256, CRC32
|       |
|       |-- Dependent Services (2)
|       |   |-- config_service.h/c    # Application configuration
|       |   |-- http_service.h/c     # HTTP client
|       |
|       |-- Database Services (4)
|       |   |-- sqlite_service.h/c    # SQLite database + migrations
|       |   |-- duckdb_service.h/c   # DuckDB database
|       |   |-- sql_query_builder.h/c # SQL query builder
|       |   |-- database_service.h/c  # Database abstraction
|       |
|       |-- Enterprise Services (3)
|       |   |-- auth_service.h/c      # JWT authentication
|       |   |-- error_service.h/c     # Error tracking
|       |   |-- updater_service.h/c   # Auto-updater
|       |
|       |-- Integration Services (1)
|       |   |-- crud_api.h/c          # CRUD API handlers
|       |
|       |-- High-level Services (1)
|           |-- webui_service.h/c     # WebUI window management
|
|-- frontend/                        # Angular frontend application
|   |-- package.json                # Node.js dependencies
|   |-- tsconfig.json               # TypeScript config
|   |-- angular.json                # Angular CLI config
|   |-- rspack.config.js           # Rspack bundler config
|   |-- biome.json                 # Biome linter config
|   |-- playwright.config.ts       # Playwright E2E config
|   |-- README.md                  # Frontend documentation
|   |
|   |-- src/                       # Frontend source
|   |   |-- main.ts               # Frontend entry point
|   |   |-- index.html            # HTML template
|   |   |-- styles.css            # Global styles
|   |   |-- winbox-loader.ts     # WinBox window loader
|   |
|   |   |-- views/                # View components
|   |   |   |-- app.component.*  # Root component
|   |   |   |-- home/            # Home view
|   |   |   |-- auth/            # Auth view
|   |   |   |-- sqlite/          # SQLite CRUD view
|   |   |   |-- devtools/        # DevTools view
|   |   |   |-- shared/          # Shared components
|   |
|   |   |-- core/                # Core services (19 total)
|   |   |   |-- api.service.ts          # API communication
|   |   |   |-- communication.service.ts # WebUI bridge
|   |   |   |-- http.service.ts         # HTTP client
|   |   |   |-- logger.service.ts      # Client logging
|   |   |   |-- theme.service.ts       # Theme management
|   |   |   |-- storage.service.ts     # localStorage + TTL
|   |   |   |-- cache.service.ts       # LRU cache
|   |   |   |-- query.service.ts       # Data fetching
|   |   |   |-- task.service.ts        # Debounce/throttle
|   |   |   |-- notification.service.ts # Toast notifications
|   |   |   |-- loading.service.ts     # Loading indicators
|   |   |   |-- clipboard.service.ts   # Clipboard operations
|   |   |   |-- winbox.service.ts      # Window manager
|   |   |   |-- network-monitor.service.ts # Online detection
|   |   |   |-- devtools.service.ts    # Dev utilities
|   |   |   |-- global-error.service.ts # Error handling
|   |   |   |-- lucide-icons.provider.ts # Icon provider
|   |   |   |-- webui/               # WebUI integration
|   |   |   |-- index.ts             # Barrel export
|   |
|   |   |-- models/                # TypeScript models
|   |   |-- types/                 # TypeScript types
|   |   |-- environments/          # Environment configs
|   |   |-- assets/                # Static assets
|   |   |-- integration/           # Integration tests
|   |   |-- e2e/                  # E2E tests
|   |
|   |-- dist/                      # Build output
|       |-- browser/              # Browser build
|
|-- thirdparty/                    # Third-party libraries
|   |-- webui/                   # WebUI library
|   |   |-- include/             # WebUI headers
|   |   |-- src/                 # WebUI source
|   |   |-- bridge/              # WebUI bridge (TypeScript)
|   |-- duckdb_cli-linux-amd64/  # DuckDB CLI
|   |-- libduckdb-linux-amd64/    # DuckDB library
|
|-- frontend-legacy/              # Legacy frontend (reference)
|
|-- build/                       # Build output (generated)
    |-- main                     # Compiled binary
    |-- libwebui-2.a            # WebUI static library
```

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

### Frontend Commands

```bash
# Run unit tests
cd frontend && bun test

# Run E2E tests
cd frontend && bunx playwright test
```

## Architecture

### Backend Layers

```
                    +-------------------+
                    |   WebuiService    |
                    |   (high-level)    |
                    +----------+--------+
                               |
        +----------------------+----------------------+
        |                      |                      |
+------+------+         +------+------+         +-----+-----+
| ConfigService |        |HttpService |         |Enterprise  |
+---------------+        +------+------+         |  Services  |
                               |               +-----+-----+
                        +------+------+              |
                        | Logger     |              |
                        | Event      |              |
                        | File       |              |
                        +-----+------+              |
                              |                     |
                        +-----+------+        +------+------+
                        | Foundation Services       |
                        +------------+-------------+
```

### Service Directory Structure

| Layer | Services |
|-------|----------|
| Foundation | logger, event, file, timer, json, hash |
| Dependent | config, http |
| Database | sqlite, duckdb, sql_query_builder, database |
| Enterprise | auth, error, updater |
| Integration | crud_api |
| High-level | webui |

### Frontend Architecture

```
src/
|-- views/          # Page components (app, home, auth, sqlite, devtools)
|-- core/          # Services (API, cache, storage, theme, etc.)
|-- models/        # Data models
|-- types/         # TypeScript type definitions
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| users | User accounts with name, email, age |
| categories | Product categories with color/icon |
| products | Products with price, stock, SKU |
| orders | Customer orders with status |
| order_items | Order line items |
| schema_migrations | Migration tracking |

### Seed Data

- 8 sample users
- 10 products across 5 categories
- 6 sample orders with items

## API Communication

### Backend to Frontend (WebUI Bindings)

The backend exposes CRUD handlers via WebUI:

| Function | Description |
|----------|-------------|
| getUsers | Fetch all users |
| createUser | Create new user |
| updateUser | Update existing user |
| deleteUser | Delete user |
| getUserStats | Get user statistics |
| getProducts | Fetch all products |
| getCategories | Fetch all categories |
| getOrders | Fetch all orders |

### Frontend API Service

The Angular ApiService uses WebUI bridge for communication:

```typescript
// Call backend
const users = await this.api.callOrThrow<User[]>('getUsers');

// Create/Update
await this.api.callOrThrow('createUser', [userData]);
await this.api.callOrThrow('updateUser', [userData]);

// Delete
await this.api.callOrThrow('deleteUser', [userId]);
```

## Documentation

### Documentation Index

| File | Description |
|------|-------------|
| docs/README.md | Documentation index |
| docs/backend/README.md | Backend overview |
| docs/frontend/README.md | Frontend overview |
| docs/BACKEND_TESTING.md | Testing guide |
| docs/DUCKDB_QUERY_BUILDER.md | Query builder API |

### Service Documentation

See `docs/backend/services/` for individual service documentation.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Build | nob.h, Bun |
| Backend | C (C99), WebUI, CivetWeb |
| Database | SQLite, DuckDB |
| Frontend | Angular v21, TypeScript, Rspack |
| Testing | CTest, Bun Test, Playwright |

## License

- nob.h - Public Domain
- WebUI - MIT License
- Angular - MIT License
