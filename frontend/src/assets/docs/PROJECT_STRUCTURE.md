# Project Structure

## Root Directory

```
starter-ccode-webui-angular-rspack/
├── frontend/              # Angular application
├── frontend-alt88/       # Alternative frontend (legacy)
├── frontend-alt99/       # Alternative frontend (legacy)
├── src/                  # C backend source
├── thirdparty/          # External libraries
├── data/                 # Application data
├── docs/                 # Project documentation
├── build/                # Build output
├── build.c               # Build script
├── nob.h                 # Build system
├── run.sh               # Quick start script
└── CHANGELOG.md         # Version history
```

## Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── constants/    # App constants
│   │   └── services/    # Business services
│   │
│   ├── core/
│   │   ├── api.service.ts
│   │   ├── logger.service.ts
│   │   ├── communication.service.ts
│   │   ├── http.service.ts
│   │   ├── database-mode.service.ts
│   │   ├── notification.service.ts
│   │   ├── devtools.service.ts
│   │   └── webui/
│   │
│   ├── views/
│   │   ├── dashboard/
│   │   ├── sqlite/
│   │   ├── duckdb/
│   │   ├── devtools/
│   │   ├── auth/
│   │   └── shared/
│   │
│   ├── models/          # Data interfaces
│   ├── types/           # TypeScript types
│   ├── assets/
│   │   └── docs/        # Documentation
│   └── environments/
│
├── package.json
├── angular.json
├── rspack.config.js
├── biome.json
└── tsconfig.json
```

## Backend Structure

```
src/
├── main.c               # Entry point
├── app_module.h         # Service registration
├── migrations.h         # Database migrations
│
├── di/
│   ├── di.h            # DI system header
│   └── di_impl.c       # DI implementation
│
├── services/
│   ├── Foundation (6)
│   │   ├── logger_service.h/c
│   │   ├── event_service.h/c
│   │   ├── file_service.h/c
│   │   ├── timer_service.h/c
│   │   ├── json_service.h/c
│   │   └── hash_service.h/c
│   │
│   ├── Database (4)
│   │   ├── sqlite_service.h/c
│   │   ├── duckdb_service.h/c
│   │   ├── sql_query_builder.h/c
│   │   └── database_service.h/c
│   │
│   ├── Integration (4)
│   │   ├── http_service.h/c
│   │   ├── webui_service.h/c
│   │   ├── config_service.h/c
│   │   └── crud_api.h/c
│   │
│   └── Business (3)
│       ├── auth_service.h/c
│       ├── error_service.h/c
│       └── updater_service.h/c
│
└── tests/
    ├── test_all.c
    ├── test_runner.c
    └── suites/
```

## Data Directory

```
data/
└── app.db              # SQLite database
```

## Key Files

| File | Purpose |
|------|---------|
| `build.c` | Build script (nob.h) |
| `run.sh` | Quick run wrapper |
| `app_module.h` | Service DI registration |
| `crud_api.c` | Frontend API handlers |
| `migrations.h` | DB schema migrations |
| `webui.js` | Frontend-backend bridge |

## Configuration

| File | Purpose |
|------|---------|
| `frontend/package.json` | Frontend dependencies |
| `frontend/tsconfig.json` | TypeScript config |
| `frontend/rspack.config.js` | Bundler config |
| `frontend/biome.json` | Linter config |
