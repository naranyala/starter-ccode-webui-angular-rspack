# Architecture

## System Overview

This application combines a C99 backend with an Angular 19 frontend, connected via WebUI for native desktop experience.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Angular Frontend                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Dashboard & Navigation                            │ │
│  │  - SQLite CRUD Component                           │ │
│  │  - DuckDB Analytics Component                      │ │
│  └────────────────────────────────────────────────────┘ │
│                            │                              │
│                    WebUI Bridge                           │
└────────────────────────────┼──────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                      C Backend                             │
│  ┌─────────────────────────▼────────────────────────────┐ │
│  │  CRUD API Handlers                                    │ │
│  │  - User operations                                    │ │
│  │  - Product operations                                 │ │
│  │  - Order operations                                   │ │
│  └─────────────────────────┬────────────────────────────┘ │
│                            │                               │
│  ┌─────────────────────────▼────────────────────────────┐ │
│  │  Database Services                                    │ │
│  │  - SQLite Service (OLTP)                              │ │
│  │  - DuckDB Service (OLAP)                              │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## Backend Service Layers

### Foundation Layer
- **LoggerService**: Logging with file rotation
- **EventService**: Pub/sub event bus
- **FileService**: File system operations
- **TimerService**: Timing and scheduling
- **JsonService**: JSON parsing/generation
- **HashService**: Cryptographic hashing

### Database Layer
- **SQLiteService**: Transactional database operations
- **DuckDBService**: Analytical database operations
- **DataValidation**: Foreign key validation

### Enterprise Layer
- **AuthService**: JWT authentication
- **ErrorService**: Error tracking
- **UpdaterService**: Auto-updates

### Integration Layer
- **CrudAPI**: Frontend-backend bridge
- **WebuiService**: Window management

## Frontend Architecture

### Core Services
- **ApiService**: Backend communication
- **StorageService**: LocalStorage with TTL
- **NotificationService**: Toast notifications
- **LoggerService**: Client-side logging

### Components
- **DashboardComponent**: Main navigation
- **SqliteCrudComponent**: SQLite CRUD demo
- **DuckdbAnalyticsComponent**: DuckDB analytics dashboard

## Data Flow

1. User interacts with Angular component
2. Component calls ApiService
3. ApiService invokes WebUI bridge function
4. C backend handler processes request
5. Database operation executed
6. Response returned through same path

## Security Features

- SQL injection prevention via prepared statements
- Input validation at API boundaries
- JWT authentication
- Delete operation validation
- XSS protection (Angular built-in)
