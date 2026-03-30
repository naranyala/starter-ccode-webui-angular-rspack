# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular 21 Frontend                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Views     │  │  Services   │  │    Core         │   │
│  │ (Components)│  │  (Business) │  │  (Infrastructure)│   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebUI Bridge (webui.js)
┌──────────────────────────▼──────────────────────────────────┐
│                      C Backend                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Application Services                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │   │
│  │  │   Auth   │  │   CRUD   │  │   Updater    │     │   │
│  │  └──────────┘  └──────────┘  └──────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Foundation Services                      │   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐          │   │
│  │  │Logger │ │ Event │ │ Timer │ │  Hash │          │   │
│  │  └───────┘ └───────┘ └───────┘ └───────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Database Layer                           │   │
│  │        ┌─────────────┐   ┌─────────────┐            │   │
│  │        │  SQLite     │   │   DuckDB    │            │   │
│  │        └─────────────┘   └─────────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Tech Stack
- **Angular 21** - UI Framework
- **Signals** - Reactive state management
- **Standalone Components** - No NgModules
- **Rspack** - Fast bundler (esbuild-powered)

### Directory Structure
```
frontend/src/
├── core/                    # Infrastructure
│   ├── api.service.ts      # Backend communication
│   ├── logger.service.ts   # Logging
│   └── communication.service.ts
│
├── views/                   # Page components
│   ├── dashboard/          # Main dashboard
│   ├── sqlite/             # SQLite CRUD
│   ├── duckdb/             # DuckDB views
│   └── ...
│
├── models/                 # Data models
└── types/                  # TypeScript types
```

## Backend Architecture

### Service Categories

| Category | Services |
|----------|----------|
| Foundation | Logger, Event, File, Timer, JSON, Hash |
| Database | SQLite, DuckDB, Query Builder |
| Integration | HTTP, WebUI, Config |
| Business | Auth, CRUD API, Error, Updater |

### Dependency Injection

Services are registered in `app_module.h`:

```c
// Register service
DI_Container_Register(container, "logger", DI_SCOPE_SINGLETON, 
    logger_service_provider, logger_service_destroy);

// Inject service
LoggerService* logger = logger_service_inject();
```

### Database Layer

```
┌─────────────────┐
│ DatabaseService  │  (Abstract interface)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│SQLite │ │DuckDB │
│Service│ │Service│
└───────┘ └───────┘
```

## Data Flow

1. **User Action** → Angular Component
2. **API Call** → ApiService.callOrThrow()
3. **WebUI Bridge** → webui.js
4. **C Handler** → crud_api.c
5. **Service** → SQLite/DuckDB
6. **Response** → JSON → Frontend

## Key Patterns

### Frontend
- **Signals** for reactive state
- **inject()** for dependency injection  
- **async/await** for API calls

### Backend
- **Service injection** pattern
- **Result structs** for error handling
- **Migration system** for schema changes
