# C + Angular WebUI Desktop Application

A production-ready full-stack desktop application featuring a C99 backend with WebUI for native windows and an Angular 19 frontend with Rspack bundling. The application provides dual database support with SQLite for transactional workloads and DuckDB for analytical operations.

## Table of Contents

- [Overview](#overview)
- [Database Options](#database-options)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Backend Services](#backend-services)
- [Frontend Services](#frontend-services)
- [Database Integration](#database-integration)
- [API Reference](#api-reference)
- [Build Commands](#build-commands)
- [Testing](#testing)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Security](#security)
- [License](#license)

---

## Overview

This project demonstrates a complete desktop application architecture combining:

- **Backend**: C99 with custom dependency injection system, 16 modular services
- **Frontend**: Angular 19 with signals-based reactivity, standalone components
- **Database Layer**: Dual support for SQLite (OLTP) and DuckDB (OLAP)
- **Security**: JWT authentication, input validation, SQL injection prevention
- **Testing**: Comprehensive test suites for both backend and frontend

The application is designed for production use with emphasis on code quality, security, and maintainability.

---

## Database Options

This application supports two database engines, each optimized for different use cases:

### SQLite - Transactional Database (OLTP)

**Best For**: CRUD operations, user management, transactional workloads

**Characteristics**:
- Row-oriented storage
- ACID-compliant transactions
- Embedded deployment (single file)
- Low memory footprint
- Excellent for read/write operations on individual records
- Mature ecosystem with extensive tooling

**Use Cases**:
- User authentication and management
- Product catalogs
- Order processing
- Configuration storage
- Session management

**Performance Profile**:
- Fast point lookups by primary key
- Efficient single-row inserts and updates
- Suitable for concurrent read operations (with WAL mode)
- Optimal for workloads with many small transactions

**File Location**: `data/app.db`

### DuckDB - Analytical Database (OLAP)

**Best For**: Analytics, reporting, complex aggregations, business intelligence

**Characteristics**:
- Column-oriented storage
- Vectorized query execution
- Optimized for analytical queries
- Excellent compression for numerical data
- Superior performance on GROUP BY and aggregations
- Modern SQL feature support

**Use Cases**:
- Business intelligence dashboards
- Data analytics and reporting
- Complex aggregations across large datasets
- Time-series analysis
- Statistical computations

**Performance Profile**:
- 10-100x faster than SQLite for aggregations
- Efficient columnar scans
- Optimal for queries accessing many rows but few columns
- Superior performance on JOIN operations

**File Location**: `data/analytics.db`

### Choosing Between SQLite and DuckDB

| Workload Type | Recommended Database | Rationale |
|---------------|---------------------|-----------|
| User authentication | SQLite | Transactional, frequent updates |
| Product CRUD | SQLite | Row-based operations |
| Order processing | SQLite | ACID requirements |
| Sales analytics | DuckDB | Aggregations across orders |
| User behavior analysis | DuckDB | Columnar scans, grouping |
| Financial reporting | DuckDB | Complex calculations |
| Real-time dashboards | DuckDB | Fast aggregations |
| Configuration storage | SQLite | Simple key-value patterns |

### Using Both Databases Together

The application supports running both databases simultaneously:

- **SQLite**: Primary data store for application state
- **DuckDB**: Analytics engine fed from SQLite data

Example architecture:
```
User Actions -> SQLite (transactions)
     |
     v
ETL Process -> DuckDB (analytics)
     |
     v
Dashboard <- DuckDB queries
```

---

## Quick Start

### Prerequisites

**Required**:
- GCC 9 or later (C99 compiler)
- Bun 1.0 or later (package manager)
- Linux, macOS, or Windows with WSL

**Optional**:
- SQLite3 CLI (for database inspection)
- DuckDB CLI (for analytics database)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd starter-ccode-webui-angular-rspack

# Install frontend dependencies
cd frontend
bun install
cd ..

# Build and run application
./run.sh dev
```

### First Run

On first execution, the application will:
1. Create the `data/` directory
2. Initialize SQLite database with schema migrations
3. Insert seed data for demonstration
4. Launch the WebUI window with Angular frontend

Access the application through the native window or browser at the displayed URL.

---

## Architecture

### System Architecture

```
+----------------------------------------------------------+
|                    Angular Frontend                       |
|  +------------------+  +-------------------------------+  |
|  |  Dashboard       |  |  Database Demos               |  |
|  |  - Navigation    |  |  - SQLite CRUD                |  |
|  |  - Stats         |  |  - DuckDB Analytics           |  |
|  +------------------+  +-------------------------------+  |
|                            |                              |
|                    WebUI Bridge                            |
+----------------------------------------------------------+
                            |
+----------------------------------------------------------+
|                      C Backend                            |
|  +------------------+  +-------------------------------+  |
|  |  WebUI Service   |  |  CRUD API Handlers            |  |
|  +------------------+  +-------------------------------+  |
|                            |                              |
|  +------------------+  +-------------------------------+  |
|  |  SQLite Service  |  |  DuckDB Service               |  |
|  +------------------+  +-------------------------------+  |
|                            |                              |
|  +----------------------------------------------------+   |
|  |  Foundation Services (Logger, Event, File, etc.)   |   |
|  +----------------------------------------------------+   |
+----------------------------------------------------------+
```

### Service Layers

The backend implements a layered architecture:

1. **Foundation Layer**: Core utilities with no dependencies
2. **Dependent Layer**: Services depending on foundation
3. **Database Layer**: SQLite and DuckDB abstractions
4. **Enterprise Layer**: Authentication, error handling, updates
5. **Integration Layer**: CRUD API, database mode switching
6. **High-level Layer**: WebUI window management

### Dependency Injection

The application uses a custom stb-style single-header DI system inspired by Angular:

```c
// Service declaration
DI_DECLARE_SERVICE(LoggerService, logger_service);

// Service registration (in app_module.h)
DI_REGISTER_SINGLETON(logger_service);

// Service injection
LoggerService* logger = logger_service_inject();
```

Features:
- Singleton and transient scopes
- Constructor injection
- Circular dependency detection
- Type-safe service resolution

---

## Project Structure

```
.
├── README.md                    # This file
├── CHANGELOG.md                 # Version history
├── run.sh                       # Build wrapper script
├── nob.h                        # Single-header build library
├── build.c                      # Build configuration
│
├── src/                         # C backend source
│   ├── main.c                   # Application entry point
│   ├── app_module.h             # DI module registration
│   ├── migrations.h             # Database schema migrations
│   ├── constants.h              # Centralized constants
│   ├── core/                    # Core utilities
│   │   ├── base_service.h       # Base service macros
│   │   └── error_utils.h        # Error handling utilities
│   ├── di/                      # Dependency injection
│   │   ├── di.h                 # DI system header
│   │   ├── di_impl.c            # DI implementation
│   │   └── README.md            # DI documentation
│   ├── services/                # Service implementations
│   │   ├── logger_service.*     # Logging service
│   │   ├── event_service.*      # Event bus service
│   │   ├── file_service.*       # File operations
│   │   ├── timer_service.*      # Timing utilities
│   │   ├── json_service.*       # JSON parsing
│   │   ├── hash_service.*       # Cryptographic hashing
│   │   ├── config_service.*     # Configuration
│   │   ├── http_service.*       # HTTP client
│   │   ├── sqlite_service.*     # SQLite database
│   │   ├── duckdb_service.*     # DuckDB database
│   │   ├── auth_service.*       # Authentication
│   │   ├── error_service.*      # Error tracking
│   │   ├── updater_service.*    # Auto-updates
│   │   ├── webui_service.*      # WebUI wrapper
│   │   ├── crud_api.*           # CRUD handlers
│   │   ├── data_validation.*    # Delete validation
│   │   └── database_service.*   # Database abstraction
│   └── tests/                   # Test suites
│       ├── test_all.c           # Comprehensive runner
│       ├── test_security.c      # Security tests
│       └── suites/              # Per-service tests
│
├── frontend/                    # Angular frontend
│   ├── src/
│   │   ├── main.ts              # Bootstrap
│   │   ├── app/                 # App modules
│   │   │   ├── services/        # App services
│   │   │   └── models/          # Data models
│   │   ├── views/               # View components
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── sqlite/          # SQLite CRUD demo
│   │   │   ├── duckdb/          # DuckDB analytics
│   │   │   ├── home/            # Home view
│   │   │   ├── auth/            # Authentication
│   │   │   └── shared/          # Shared components
│   │   ├── core/                # Core services
│   │   │   ├── api.service.ts   # API communication
│   │   │   ├── storage.service.ts
│   │   │   ├── logger.service.ts
│   │   │   └── ...
│   │   └── styles/              # Global styles
│   ├── package.json
│   └── rspack.config.ts
│
├── thirdparty/                  # External libraries
│   └── webui/                   # WebUI framework
│
├── docs/                        # Documentation
│   ├── README.md                # Documentation index
│   ├── DUCKDB_CRUD_INTEGRATION.md
│   ├── SQLITE_CRUD_INTEGRATION.md
│   ├── STYLE_GUIDE.md
│   ├── FRONTEND_DEMOS.md
│   ├── ABSTRACTION_AUDIT_REPORT.md
│   ├── REFACTORING_ROADMAP_2026.md
│   ├── SECURITY_AUDIT_REPORT.md
│   └── backend/                 # Backend docs
│       └── services/            # Service documentation
│
└── data/                        # Application data
    ├── app.db                   # SQLite database
    └── analytics.db             # DuckDB database
```

---

## Backend Services

### Foundation Layer (No Dependencies)

| Service | File | Description |
|---------|------|-------------|
| LoggerService | logger_service.* | Logging with levels, file output, rotation |
| EventService | event_service.* | Pub/sub event bus for decoupled communication |
| FileService | file_service.* | File read/write, existence checks, copy, delete |
| TimerService | timer_service.* | One-shot and repeating timers |
| JsonService | json_service.* | JSON parsing and serialization |
| HashService | hash_service.* | MD5, SHA1, SHA256, CRC32 hashing |

### Dependent Layer

| Service | File | Dependencies | Description |
|---------|------|--------------|-------------|
| ConfigService | config_service.* | LoggerService | Application configuration management |
| HttpService | http_service.* | LoggerService | HTTP client (GET, POST, PUT, DELETE) |

### Database Layer

| Service | File | Description |
|---------|------|-------------|
| SQLiteService | sqlite_service.* | SQLite database with migrations, prepared statements, transactions |
| DuckDBService | duckdb_service.* | DuckDB for analytical queries |
| DatabaseService | database_service.* | Abstraction layer for database mode switching |

### Enterprise Layer

| Service | File | Description |
|---------|------|-------------|
| AuthService | auth_service.* | JWT authentication, password hashing, user management |
| ErrorService | error_service.* | Error tracking, reporting, persistence |
| UpdaterService | updater_service.* | Application update checking and installation |

### Integration Layer

| Service | File | Description |
|---------|------|-------------|
| CrudAPI | crud_api.* | CRUD operation handlers for frontend |
| DataValidation | data_validation.* | Foreign key validation for safe deletions |

### High-level Layer

| Service | File | Description |
|---------|------|-------------|
| WebuiService | webui_service.* | WebUI window management and event binding |

---

## Frontend Services

### Communication Services

| Service | File | Description |
|---------|------|-------------|
| ApiService | api.service.ts | Backend API calls with loading/error states |
| CommunicationService | communication.service.ts | Multi-channel communication (WebUI, events, state sync) |
| HttpService | http.service.ts | HTTP client wrapper with timeout handling |

### Storage Services

| Service | File | Description |
|---------|------|-------------|
| StorageService | storage.service.ts | LocalStorage with TTL support |
| CacheService | cache.service.ts | In-memory caching with eviction |

### UI Services

| Service | File | Description |
|---------|------|-------------|
| ThemeService | theme.service.ts | Dark/light theme management |
| NotificationService | notification.service.ts | Toast notifications |
| LoadingService | loading.service.ts | Loading indicators |
| WinBoxService | winbox.service.ts | Window management |

### Utility Services

| Service | File | Description |
|---------|------|-------------|
| LoggerService | logger.service.ts | Client-side logging |
| DevToolsService | devtools.service.ts | Development utilities |
| DatabaseModeService | database-mode.service.ts | SQLite/DuckDB mode switching |

---

## Database Integration

### SQLite Integration

**Setup**:
```c
SQLiteService* sqlite = sqlite_service_inject();
sqlite_open(sqlite, "data/app.db");

/* Run migrations */
sqlite_migrate(sqlite, migrations, migrations_count, -1);
```

**Schema Migrations**:
The application includes automatic schema migrations:
1. Categories table
2. Users table
3. Products table
4. Orders table
5. Order items table
6. Seed data

**CRUD Operations**:
See `docs/SQLITE_CRUD_INTEGRATION.md` for complete integration guide.

### DuckDB Integration

**Setup**:
```c
DuckDBService* duckdb = duckdb_service_inject();
duckdb_open(duckdb, "data/analytics.db");
```

**Use Cases**:
- Aggregation queries (SUM, AVG, COUNT)
- Complex JOINs
- Time-series analysis
- Business intelligence

**CRUD Operations**:
See `docs/DUCKDB_CRUD_INTEGRATION.md` for complete integration guide.

### Data Validation

Before deleting records, the application validates foreign key constraints:

```c
DependencyInfo info;
ValidationCode result = validate_user_delete(sqlite, user_id, &info);

if (result == VALIDATION_HAS_DEPENDENCIES) {
    /* Cannot delete - user has orders */
    printf("Cannot delete: %d orders reference this user\n", info.count);
}
```

This prevents orphaned records and maintains data integrity.

---

## API Reference

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | getUsers | List all users with pagination |
| POST | createUser | Create new user |
| PUT | updateUser | Update existing user |
| DELETE | deleteUser | Delete user (with validation) |
| POST | validateDeleteUser | Check if user can be safely deleted |
| GET | getUserStats | Get user statistics |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | getProducts | List all products |
| GET | getCategories | List all categories |
| POST | createProduct | Create new product |
| PUT | updateProduct | Update existing product |
| DELETE | deleteProduct | Delete product |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | getOrders | List all orders |
| POST | createOrder | Create new order |
| PUT | updateOrder | Update existing order |
| DELETE | deleteOrder | Delete order |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | getDashboardStats | Get dashboard statistics |
| GET | getCategoryStats | Get category performance |

---

## Build Commands

### Main Commands

```bash
./run.sh              # Show help
./run.sh dev          # Build and run application
./run.sh build        # Build only (no run)
./run.sh clean        # Clean build artifacts
./run.sh rebuild      # Clean and rebuild
./run.sh test         # Run all tests
```

### Frontend Commands

```bash
cd frontend

bun install           # Install dependencies
bun run dev           # Development server
bun run build         # Production build
bun run watch         # Watch mode
bun test              # Run unit tests
```

### Backend Compilation

```bash
# Direct compilation (alternative to run.sh)
gcc -Wall -Wextra -g -o build/main \
    src/main.c src/services/*.c src/di/di_impl.c \
    -I./src -lpthread -ldl -lsqlite3
```

---

## Testing

### Backend Tests

```bash
# Run all backend tests
./run.sh test

# Run specific test suite
./build/test_all

# Run security tests
./build/test_security
```

**Test Coverage**:
- Foundation services (logger, event, file, timer, json, hash)
- Database services (sqlite, duckdb)
- Enterprise services (auth, error, updater)
- Security tests (buffer overflow, SQL injection, input validation)

### Frontend Tests

```bash
cd frontend

# Run all tests
bun test

# Run security tests
bun test --include='**/security.test.ts'
```

**Test Coverage**:
- Component tests
- Service tests
- Security tests (XSS, storage, API, authentication)

---

## Documentation

### Integration Guides

| Document | Description |
|----------|-------------|
| [docs/SQLITE_CRUD_INTEGRATION.md](docs/SQLITE_CRUD_INTEGRATION.md) | Complete SQLite CRUD integration guide |
| [docs/DUCKDB_CRUD_INTEGRATION.md](docs/DUCKDB_CRUD_INTEGRATION.md) | Complete DuckDB CRUD integration guide |
| [docs/FRONTEND_DEMOS.md](docs/FRONTEND_DEMOS.md) | Frontend demo components documentation |

### Development Guides

| Document | Description |
|----------|-------------|
| [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) | Coding standards and patterns |
| [docs/REFACTORING_ROADMAP_2026.md](docs/REFACTORING_ROADMAP_2026.md) | Refactoring priorities and timeline |
| [docs/ABSTRACTION_AUDIT_REPORT.md](docs/ABSTRACTION_AUDIT_REPORT.md) | Code quality audit findings |

### Security Documentation

| Document | Description |
|----------|-------------|
| [docs/SECURITY_AUDIT_REPORT.md](docs/SECURITY_AUDIT_REPORT.md) | Comprehensive security audit |
| [docs/SECURITY_FIXES_IMPLEMENTED.md](docs/SECURITY_FIXES_IMPLEMENTED.md) | Security fix implementation status |

### Backend Service Documentation

| Document | Description |
|----------|-------------|
| [docs/backend/services/sqlite.md](docs/backend/services/sqlite.md) | SQLite service API |
| [docs/backend/services/duckdb.md](docs/backend/services/duckdb.md) | DuckDB service API |
| [docs/backend/services/crud-api.md](docs/backend/services/crud-api.md) | CRUD API handlers |

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Build System | nob.h | Latest | Single-header build library |
| Package Manager | Bun | 1.0+ | Fast JavaScript package manager |
| Backend Language | C | C99 | System programming |
| Frontend Framework | Angular | 19 | UI framework |
| Frontend Language | TypeScript | 5.x | Type-safe JavaScript |
| Bundler | Rspack | Latest | Rust-based bundler |
| Database (OLTP) | SQLite | 3.51+ | Transactional database |
| Database (OLAP) | DuckDB | 1.x | Analytical database |
| UI Framework | WebUI | Latest | Native window with web frontend |
| Testing (Backend) | CTest | - | C test framework |
| Testing (Frontend) | Jasmine/Karma | - | JavaScript testing |

---

## Security

### Security Features

- **SQL Injection Prevention**: Prepared statements for all database queries
- **Input Validation**: Server-side validation for all user input
- **Password Security**: SHA256 hashing with salt (migration to bcrypt recommended)
- **JWT Authentication**: Token-based authentication with expiration
- **XSS Protection**: Angular's built-in sanitization
- **Delete Validation**: Foreign key constraint checking before deletions

### Security Audit

A comprehensive security audit was conducted in March 2026. Findings and remediation status:

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 17 | Partially addressed |
| High | 13 | In progress |
| Medium | 12 | Planned |
| Low | 7 | Backlog |

See [docs/SECURITY_AUDIT_REPORT.md](docs/SECURITY_AUDIT_REPORT.md) for complete findings.

### Security Best Practices

1. Always use prepared statements for SQL queries
2. Validate all user input at API boundaries
3. Use environment variables for secrets (never hardcode)
4. Enable HTTPS in production deployments
5. Regular dependency updates
6. Quarterly security audits

---

## License

| Component | License |
|-----------|---------|
| nob.h | Public Domain |
| WebUI | MIT |
| Angular | MIT |
| This Project | MIT |

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run full test suite
5. Submit pull request

### Code Style

- Backend: Follow [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md)
- Frontend: Angular style guide with signals preference
- Documentation: Markdown with clear examples

---

## Support

- **Documentation**: See `docs/` directory
- **Issues**: GitHub issue tracker
- **Security**: Report vulnerabilities via security advisory

---

**Last Updated**: March 30, 2026  
**Version**: 2.0  
**Maintainer**: Development Team
