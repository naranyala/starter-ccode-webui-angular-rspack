# C + Angular WebUI Project

> A full-stack desktop application with a C backend using WebUI for native windows and an Angular 21 frontend with Rspack bundler.

## Overview

This project combines modern Angular frontend with a high-performance C backend, creating a native desktop application using WebUI. It supports both SQLite and DuckDB databases with automatic migrations.

## Features

- **Database Support**: SQLite and DuckDB with migrations
- **Authentication**: JWT-based auth with password hashing  
- **CRUD Operations**: Full API handlers for database operations
- **Error Handling**: Centralized error tracking and logging
- **Dependency Injection**: Custom DI system inspired by Angular
- **Hot Reload**: Fast development with Rspack bundler

## Quick Start

```bash
# Install dependencies
cd frontend && bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run backend
cd .. && ./run.sh dev
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Angular 21 Frontend             │
│  (Rspack + Signals + Standalone)       │
└────────────────┬────────────────────────┘
                 │ WebUI Bridge
┌────────────────▼────────────────────────┐
│           C Backend                    │
│  ┌─────────────┬─────────────────┐    │
│  │  Services   │   Database     │    │
│  │  (16 total) │  SQLite/DuckDB │    │
│  └─────────────┴─────────────────┘    │
└─────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21, Rspack, Signals |
| Backend | C, WebUI, SQLite, DuckDB |
| Build | Bun, nob.h |
| Testing | Playwright, Bun |

## Project Structure

```
frontend/           # Angular application
├── src/
│   ├── core/      # Core services
│   ├── views/     # Page components
│   └── assets/    # Static assets
src/               # C backend
├── services/      # 16 backend services
├── di/           # Dependency injection
└── tests/         # Backend tests
```

## Common Tasks

### Running the App

```bash
# Full stack (frontend + backend)
./run.sh dev

# Frontend only
cd frontend && bun run dev

# Backend only
./run.sh build && ./build/main
```

### Database Operations

```bash
# Database file location
data/app.db

# Open with SQLite CLI
sqlite3 data/app.db
```

### Adding New Features

1. Create service in `src/services/`
2. Register in `app_module.h`
3. Add API handler in `crud_api.c`
4. Create frontend component in `frontend/src/views/`

## Need Help?

- [Implementation Details](./IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./TESTING.md)
- [Backend Architecture](./backend_README.md)
- [Frontend Architecture](./frontend_README.md)
