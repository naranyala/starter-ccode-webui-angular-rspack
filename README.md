# C + Angular WebUI Desktop Application

A full-stack desktop application with C backend using WebUI for native windows and Angular 21 frontend with Rspack bundler.

## Features

- Dual database support: SQLite and DuckDB
- JWT authentication with secure password hashing
- Dependency injection system for C backend
- CRUD API handlers for database operations
- Comprehensive testing infrastructure
- Real-time logging and error tracking

## Prerequisites

- GCC 9+ (C compiler)
- Bun 1.0+ (package manager)
- SQLite3 (optional, for CLI access)

## Quick Start

```bash
# Install frontend dependencies
cd frontend && bun install

# Build and run (full stack)
./run.sh dev

# Build only
./run.sh build

# Run backend tests
./run.sh test
```

## Project Structure

```
.
├── README.md              # This file
├── CHANGELOG.md          # Version history
├── run.sh               # Build wrapper script
├── nob.h                # Single-header build system
├── build.c              # Build configuration
│
├── src/                 # C backend source
│   ├── main.c           # Application entry
│   ├── di/              # Dependency injection
│   ├── services/        # 16 backend services
│   └── tests/           # C test suites
│
├── frontend/            # Angular 21 frontend
│   ├── src/
│   │   ├── views/       # Page components
│   │   ├── core/        # Services
│   │   └── assets/      # Static assets
│   └── package.json
│
├── thirdparty/          # External libraries
│   └── webui/           # WebUI framework
│
└── data/                # App data (database)
```

## Backend Services

| Layer | Services |
|-------|----------|
| Foundation | logger, event, file, timer, json, hash |
| Dependent | config, http |
| Database | sqlite, duckdb, sql_query_builder, database |
| Enterprise | auth, error, updater |
| Integration | crud_api |
| High-level | webui |

## Frontend Services

| Category | Services |
|----------|----------|
| Communication | api, http, communication |
| Storage | storage, cache |
| UI | theme, notification, loading, winbox |
| Utilities | logger, clipboard, network-monitor, devtools |

## Documentation

In-app documentation is available via the dashboard:

- **Overview** - Project introduction
- **Quick Start** - Development setup guide
- **Architecture** - System design
- **Project Structure** - File layout
- **Demos** - Database demo usage
- **API Reference** - API endpoints
- **Changelog** - Version history

## Build Commands

```bash
./run.sh              # Show help
./run.sh dev          # Build and run
./run.sh build        # Build only
./run.sh clean        # Clean artifacts
./run.sh rebuild      # Clean and rebuild
./run.sh test         # Run tests

# Frontend
cd frontend && bun run dev     # Dev server
cd frontend && bun test        # Unit tests
```

## API Endpoints

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## Technology Stack

| Layer | Technology |
|-------|------------|
| Build | nob.h, Bun |
| Backend | C99, WebUI |
| Database | SQLite, DuckDB |
| Frontend | Angular 21, TypeScript, Rspack |
| Testing | CTest, Playwright |

## License

- nob.h - Public Domain
- WebUI - MIT
- Angular - MIT
