# C + Angular WebUI Desktop Application

A production-ready full-stack desktop application combining a C99 backend with WebUI for native windows and an Angular 19 frontend with Rspack bundling. The application features dual database support with SQLite for transactional operations and DuckDB for analytical workloads.

## Table of Contents

- [Overview](#overview)
- [Database Architecture](#database-architecture)
- [Quick Start](#quick-start)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Backend Services](#backend-services)
- [Frontend Components](#frontend-components)
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

This project demonstrates enterprise-grade desktop application development with:

- **Backend**: C99 with custom dependency injection, 16+ modular services
- **Frontend**: Angular 19 with signals-based reactivity, standalone components
- **Database Layer**: Dual support for SQLite (OLTP) and DuckDB (OLAP)
- **Visualization**: Vega-Lite charts for data analytics
- **Security**: JWT authentication, input validation, SQL injection prevention
- **Testing**: Comprehensive test suites for backend and frontend

The application is designed for production deployment with emphasis on code quality, security, and maintainability.

---

## Database Architecture

This application implements a dual-database architecture, leveraging the strengths of both SQLite and DuckDB for different use cases.

### SQLite - Transactional Database (OLTP)

**Purpose**: Primary data store for application state and transactional operations

**Characteristics**:
- Row-oriented storage optimized for point queries
- ACID-compliant transactions with WAL mode
- Embedded deployment (single file database)
- Low memory footprint suitable for embedded systems
- Excellent performance for read/write operations on individual records
- Mature ecosystem with extensive tooling and documentation

**Optimal Use Cases**:
- User authentication and session management
- Product catalog management with CRUD operations
- Order processing and transaction tracking
- Configuration and settings storage
- Real-time data updates with concurrent reads

**Performance Profile**:
- Sub-millisecond point lookups by primary key
- Efficient single-row inserts and updates (10,000+ ops/sec)
- Suitable for concurrent read operations with WAL mode enabled
- Optimal for workloads with many small, frequent transactions
- Index-optimized queries for filtered searches

**File Location**: `data/app.db`

**Schema Tables**:
- `users` - User accounts and authentication
- `categories` - Product categorization
- `products` - Product catalog with inventory
- `orders` - Customer orders and transactions
- `order_items` - Order line items with relationships
- `schema_migrations` - Database version tracking

### DuckDB - Analytical Database (OLAP)

**Purpose**: Analytics engine for business intelligence and complex queries

**Characteristics**:
- Column-oriented storage optimized for aggregations
- Vectorized query execution for analytical workloads
- Superior performance on GROUP BY and aggregate functions
- Excellent compression for numerical data columns
- Modern SQL feature support including window functions
- In-memory processing with disk-based persistence

**Optimal Use Cases**:
- Business intelligence dashboards and reporting
- Data analytics with complex aggregations
- Time-series analysis and trend detection
- Statistical computations and data mining
- Ad-hoc analytical queries on large datasets

**Performance Profile**:
- 10-100x faster than SQLite for aggregation queries
- Efficient columnar scans for analytical workloads
- Optimal for queries accessing many rows but few columns
- Superior performance on JOIN operations across large tables
- Batch processing optimized for bulk data operations

**File Location**: `data/analytics.db`

### Choosing Between SQLite and DuckDB

| Workload Type | Recommended Database | Technical Rationale |
|---------------|---------------------|---------------------|
| User authentication | SQLite | Transactional consistency, frequent updates |
| Product CRUD operations | SQLite | Row-based operations, indexed lookups |
| Order processing | SQLite | ACID requirements, foreign key constraints |
| Sales analytics | DuckDB | Aggregations across orders, time-series |
| User behavior analysis | DuckDB | Columnar scans, grouping operations |
| Financial reporting | DuckDB | Complex calculations, window functions |
| Real-time dashboards | DuckDB | Fast aggregations, low-latency queries |
| Configuration storage | SQLite | Simple key-value patterns, frequent reads |

### Using Both Databases Together

The application supports running both databases simultaneously in a complementary architecture:

```
User Actions -> SQLite (transactions)
     |
     v
ETL Process -> DuckDB (analytics)
     |
     v
Dashboard <- DuckDB queries
```

**Implementation Pattern**:
1. SQLite handles all write operations and transactional reads
2. Periodic ETL process syncs data to DuckDB for analytics
3. Dashboard queries run against DuckDB for optimal performance
4. Data consistency maintained through scheduled synchronization

---

## Quick Start

### Prerequisites

**Required**:
- GCC 9 or later (C99 compiler with C11 extensions)
- Bun 1.0 or later (package manager for frontend)
- Linux, macOS, or Windows with WSL

**Optional**:
- SQLite3 CLI (for database inspection and manual queries)
- DuckDB CLI (for analytics database queries)

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

1. Create the `data/` directory if it does not exist
2. Initialize SQLite database with schema migrations
3. Insert seed data for demonstration purposes
4. Launch the WebUI window with Angular frontend
5. Display the dashboard with navigation menu

Access the application through:
- The native WebUI window (automatically launched on startup)
- Browser at the displayed URL (typically http://localhost:8080)

---

## System Architecture

### High-Level Architecture

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

The backend implements a layered architecture with clear separation of concerns:

1. **Foundation Layer**: Core utilities with no dependencies (Logger, Event, File, Timer, JSON, Hash)
2. **Dependent Layer**: Services depending on foundation (Config, HTTP)
3. **Database Layer**: SQLite and DuckDB abstractions with query builders
4. **Enterprise Layer**: Authentication, error handling, auto-updates
5. **Integration Layer**: CRUD API, data validation, database mode switching
6. **High-level Layer**: WebUI window management and event binding

### Dependency Injection

The application uses a custom stb-style single-header DI system inspired by Angular:

```c
// Service declaration in header
DI_DECLARE_SERVICE(LoggerService, logger_service);

// Service registration in app_module.h
DI_REGISTER_SINGLETON(logger_service);

// Service injection and usage
LoggerService* logger = logger_service_inject();
logger_log(logger, "INFO", "Application started");
```

**Features**:
- Singleton and transient service scopes
- Constructor injection with automatic resolution
- Circular dependency detection at runtime
- Type-safe service resolution
- Service locator pattern for legacy compatibility

---

## Project Structure

```
.
├── README.md                    # Project overview (this file)
├── CHANGELOG.md                 # Version history and release notes
├── run.sh                       # Build wrapper script
├── nob.h                        # Single-header build library
├── build.c                      # Build configuration with nob.h
│
├── src/                         # C backend source code
│   ├── main.c                   # Application entry point
│   ├── app_module.h             # DI module registration
│   ├── migrations.h             # Database schema migrations
│   ├── constants.h              # Centralized constants
│   ├── core/                    # Core utilities
│   │   ├── base_service.h       # Base service macros
│   │   └── error_utils.h        # Error handling utilities
│   ├── di/                      # Dependency injection system
│   │   ├── di.h                 # DI system header
│   │   ├── di_impl.c            # DI implementation
│   │   └── README.md            # DI documentation
│   ├── services/                # Service implementations
│   │   ├── logger_service.*     # Logging with file rotation
│   │   ├── event_service.*      # Event bus for pub/sub
│   │   ├── file_service.*       # File system operations
│   │   ├── timer_service.*      # Timing and scheduling
│   │   ├── json_service.*       # JSON parsing and generation
│   │   ├── hash_service.*       # Cryptographic hashing
│   │   ├── config_service.*     # Configuration management
│   │   ├── http_service.*       # HTTP client
│   │   ├── sqlite_service.*     # SQLite database operations
│   │   ├── duckdb_service.*     # DuckDB analytical database
│   │   ├── auth_service.*       # JWT authentication
│   │   ├── error_service.*      # Error tracking and reporting
│   │   ├── updater_service.*    # Auto-update functionality
│   │   ├── webui_service.*      # WebUI window wrapper
│   │   ├── crud_api.*           # CRUD operation handlers
│   │   ├── data_validation.*    # Foreign key validation
│   │   └── database_service.*   # Database abstraction layer
│   └── tests/                   # Test suites
│       ├── test_all.c           # Comprehensive test runner
│       ├── test_security.c      # Security-focused tests
│       └── suites/              # Per-service test suites
│
├── frontend/                    # Angular frontend application
│   ├── src/
│   │   ├── main.ts              # Application bootstrap
│   │   ├── views/               # View components
│   │   │   ├── dashboard/       # Main dashboard with navigation
│   │   │   ├── sqlite/          # SQLite CRUD demonstration
│   │   │   ├── duckdb/          # DuckDB analytics dashboard
│   │   │   ├── charts/          # Vega-Lite charts gallery
│   │   │   ├── home/            # Home view
│   │   │   ├── auth/            # Authentication views
│   │   │   └── shared/          # Shared UI components
│   │   ├── core/                # Core Angular services
│   │   │   ├── api.service.ts   # Backend API communication
│   │   │   ├── storage.service.ts
│   │   │   ├── logger.service.ts
│   │   │   ├── doc.service.ts   # Documentation service
│   │   │   └── vega-charts.service.ts
│   │   └── styles/              # Global styles and themes
│   ├── package.json
│   └── angular.json
│
├── thirdparty/                  # External libraries
│   └── webui/                   # WebUI framework for native windows
│
├── docs/                        # Documentation
│   ├── README.md                # Documentation index
│   ├── DUCKDB_CRUD_INTEGRATION.md
│   ├── SQLITE_CRUD_INTEGRATION.md
│   ├── STYLE_GUIDE.md
│   ├── FRONTEND_DEMOS.md
│   ├── VEGA_CHARTS_GUIDE.md
│   └── ...
│
└── data/                        # Application data directory
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
| DuckDBService | duckdb_service.* | DuckDB for analytical queries and aggregations |
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
| CrudAPI | crud_api.* | CRUD operation handlers for frontend communication |
| DataValidation | data_validation.* | Foreign key validation for safe deletions |

### High-level Layer

| Service | File | Description |
|---------|------|-------------|
| WebuiService | webui_service.* | WebUI window management and event binding |

---

## Frontend Components

### Communication Services

| Service | File | Description |
|---------|------|-------------|
| ApiService | api.service.ts | Backend API calls with loading and error states |
| CommunicationService | communication.service.ts | Multi-channel communication (WebUI, events, state sync) |
| HttpService | http.service.ts | HTTP client wrapper with timeout handling |

### Storage Services

| Service | File | Description |
|---------|------|-------------|
| StorageService | storage.service.ts | LocalStorage with TTL support |
| CacheService | cache.service.ts | In-memory caching with eviction policies |

### UI Services

| Service | File | Description |
|---------|------|-------------|
| ThemeService | theme.service.ts | Dark and light theme management |
| NotificationService | notification.service.ts | Toast notifications |
| LoadingService | loading.service.ts | Loading indicators |
| WinBoxService | winbox.service.ts | Window management |

### Visualization Services

| Service | File | Description |
|---------|------|-------------|
| VegaChartsService | vega-charts.service.ts | Vega-Lite chart rendering |

### Utility Services

| Service | File | Description |
|---------|------|-------------|
| LoggerService | logger.service.ts | Client-side logging |
| DevToolsService | devtools.service.ts | Development utilities |
| DatabaseModeService | database-mode.service.ts | SQLite and DuckDB mode switching |
| DocService | doc.service.ts | Dynamic documentation loading |

### View Components

| Component | File | Description |
|-----------|------|-------------|
| DashboardComponent | dashboard.component.ts | Main navigation and content area |
| SqliteCrudComponent | sqlite.component.ts | SQLite CRUD operations demo |
| DuckdbAnalyticsComponent | duckdb-analytics.component.ts | DuckDB analytics dashboard |
| VegaChartsComponent | vega-charts.component.ts | Vega-Lite charts gallery |

---

## Database Integration

### SQLite Integration

**Setup**:
```c
SQLiteService* sqlite = sqlite_service_inject();
sqlite_open(sqlite, "data/app.db");

// Run migrations
sqlite_migrate(sqlite, migrations, migrations_count, -1);
```

**Schema Migrations**:
The application includes automatic schema migrations:
1. Categories table creation
2. Users table creation
3. Products table creation
4. Orders table creation
5. Order items table creation
6. Seed data insertion

**CRUD Operations**:
See `docs/SQLITE_CRUD_INTEGRATION.md` for complete integration guide with examples.

### DuckDB Integration

**Setup**:
```c
DuckDBService* duckdb = duckdb_service_inject();
duckdb_open(duckdb, "data/analytics.db");
```

**Use Cases**:
- Aggregation queries (SUM, AVG, COUNT, GROUP BY)
- Complex JOINs across multiple tables
- Time-series analysis with window functions
- Business intelligence dashboards

**CRUD Operations**:
See `docs/DUCKDB_CRUD_INTEGRATION.md` for complete integration guide with examples.

### Data Validation

Before deleting records, the application validates foreign key constraints:

```c
DependencyInfo info;
ValidationCode result = validate_user_delete(sqlite, user_id, &info);

if (result == VALIDATION_HAS_DEPENDENCIES) {
    // Cannot delete - user has orders
    printf("Cannot delete: %d orders reference this user\n", info.count);
}
```

This prevents orphaned records and maintains referential integrity.

---

## API Reference

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | getUsers | List all users with pagination |
| POST | createUser | Create new user |
| PUT | updateUser | Update existing user |
| DELETE | deleteUser | Delete user with validation |
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
| `docs/SQLITE_CRUD_INTEGRATION.md` | Complete SQLite CRUD integration guide |
| `docs/DUCKDB_CRUD_INTEGRATION.md` | Complete DuckDB CRUD integration guide |
| `docs/VEGA_CHARTS_GUIDE.md` | Vega-Lite charts integration guide |
| `docs/FRONTEND_DEMOS.md` | Frontend demo components documentation |

### Development Guides

| Document | Description |
|----------|-------------|
| `docs/STYLE_GUIDE.md` | Coding standards and patterns |
| `docs/REFACTORING_ROADMAP_2026.md` | Refactoring priorities and timeline |
| `docs/ABSTRACTION_AUDIT_REPORT.md` | Code quality audit findings |
| `docs/DYNAMIC_DOCS_GUIDE.md` | Dynamic documentation system guide |

### Security Documentation

| Document | Description |
|----------|-------------|
| `docs/SECURITY_AUDIT_REPORT.md` | Comprehensive security audit |
| `docs/SECURITY_FIXES_IMPLEMENTED.md` | Security fix implementation status |

### Backend Service Documentation

| Document | Description |
|----------|-------------|
| `docs/backend/services/sqlite.md` | SQLite service API |
| `docs/backend/services/duckdb.md` | DuckDB service API |
| `docs/backend/services/crud-api.md` | CRUD API handlers |

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
| Visualization | Vega-Lite | 5.x | Data visualization grammar |
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
- **XSS Protection**: Angular built-in sanitization
- **Delete Validation**: Foreign key constraint checking before deletions
- **Buffer Safety**: Bounds checking macros and safe string functions

### Security Audit

A comprehensive security audit was conducted in March 2026. Findings and remediation status:

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 17 | Partially addressed |
| High | 13 | In progress |
| Medium | 12 | Planned |
| Low | 7 | Backlog |

See `docs/SECURITY_AUDIT_REPORT.md` for complete findings.

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

- Backend: Follow `docs/STYLE_GUIDE.md`
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
