# Project Structure

## Directory Layout

```
.
├── README.md                    # Project overview
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
│   └── ...
│
└── data/                        # Application data
    ├── app.db                   # SQLite database
    └── analytics.db             # DuckDB database
```

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `src/main.c` | Application entry point, service initialization |
| `src/app_module.h` | DI container registration |
| `src/migrations.h` | Database schema definitions |
| `src/constants.h` | Centralized constants |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/main.ts` | Angular bootstrap |
| `frontend/src/views/dashboard/dashboard.component.ts` | Main navigation |
| `frontend/src/core/api.service.ts` | Backend API communication |

### Build

| File | Purpose |
|------|---------|
| `build.c` | Build configuration with nob.h |
| `run.sh` | Build wrapper script |
| `nob.h` | Single-header build library |

## Database Schema

### Tables

1. **users** - User accounts
2. **categories** - Product categories
3. **products** - Product catalog
4. **orders** - Customer orders
5. **order_items** - Order line items
6. **schema_migrations** - Migration tracking

See `src/migrations.h` for complete schema definitions.
