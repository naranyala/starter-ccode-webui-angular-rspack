# Development Style Guide & Patterns

**Version:** 2.0  
**Last Updated:** March 30, 2026

This guide establishes coding standards and patterns for long-term maintainability.

---

## Table of Contents

1. [Backend (C) Standards](#backend-c-standards)
2. [Frontend (Angular/TypeScript) Standards](#frontend-angulartypescript-standards)
3. [Architecture Patterns](#architecture-patterns)
4. [Code Organization](#code-organization)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation Standards](#documentation-standards)

---

## Backend (C) Standards

### Naming Conventions

```c
/* Types: PascalCase */
typedef struct LoggerService { ... } LoggerService;
typedef enum LogLevel { ... } LogLevel;

/* Functions: snake_case with module prefix */
logger_log(LoggerService* self, const char* level, ...);
logger_set_level(LoggerService* self, LogLevel level);

/* Variables: snake_case */
int log_count;
char* file_path;

/* Constants: UPPER_SNAKE_CASE */
#define MAX_LOG_SIZE 10485760
#define DEFAULT_PORT 8080

/* Macros: UPPER_SNAKE_CASE */
#define LOG_INFO(logger, ...) logger_log(logger, "INFO", __VA_ARGS__)
```

### File Organization

```
src/
├── core/                    # Core utilities (shared across services)
│   ├── base_service.h       # Base service macros
│   ├── error_utils.h        # Error handling utilities
│   └── memory_utils.h       # Memory management utilities
├── services/                # Service implementations
│   ├── logger_service.{c,h}
│   ├── config_service.{c,h}
│   └── ...
├── di/                      # Dependency injection system
└── tests/                   # Test suites
    └── suites/
```

### Service Template

```c
/**
 * @file service_name.h
 * @brief Brief description of service purpose
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * @code
 * // Usage example:
 * ServiceType* service = INJECT_SERVICE(service_name);
 * service_method(service, arg1, arg2);
 * @endcode
 */

#ifndef SERVICE_NAME_H
#define SERVICE_NAME_H

#include "di/di.h"
#include "core/base_service.h"

/* Configuration struct */
typedef struct {
    const char* setting;
    int value;
} ServiceConfig;

/* Service struct */
typedef struct ServiceType {
    DI_Service base;
    /* Service fields */
} ServiceType;

/* DI declarations */
DI_DECLARE_SERVICE(ServiceType, service_name);

/* Public API */
ServiceResult service_init_with_config(ServiceType* self, const ServiceConfig* config);
ServiceResult service_method(ServiceType* self, int arg);
void service_cleanup(ServiceType* self);

#endif
```

### Error Handling Pattern

```c
#include "core/error_utils.h"

ServiceResult my_function(MyService* self, const char* param) {
    /* Validate parameters */
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(param, RESULT_ERROR_INVALID_PARAM);
    
    /* Check state */
    if (!self->initialized) {
        return RESULT_ERROR_NOT_INITIALIZED;
    }
    
    /* Safe allocation */
    char* buffer = SAFE_ALLOC(char, size);
    if (buffer == NULL) {
        return RESULT_ERROR_OUT_OF_MEMORY;
    }
    
    /* Do work... */
    
    /* Cleanup */
    SAFE_FREE(buffer);
    return RESULT_OK;
}
```

### Logging Pattern

```c
#include "services/logger_service.h"

void my_function(MyService* self) {
    LoggerService* logger = INJECT_SERVICE(logger_service);
    
    LOG_DEBUG(logger, "Starting operation with param=%d", param);
    
    if (error_condition) {
        LOG_ERROR(logger, "Operation failed: %s", error_message);
        return;
    }
    
    LOG_INFO(logger, "Operation completed successfully");
}
```

---

## Frontend (Angular/TypeScript) Standards

### File Organization

```
frontend/src/
├── core/                      # Core services and utilities
│   ├── api.service.ts         # API communication
│   ├── logger.service.ts      # Logging service
│   ├── base-crud.component.ts # Base CRUD component
│   └── ui-components.ts       # Shared UI components
├── views/                     # Page components
│   ├── dashboard/
│   ├── duckdb/
│   └── sqlite/
├── models/                    # Data models/interfaces
└── styles/                    # Global styles
```

### Component Template

```typescript
/**
 * Component Description
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * @example
 * ```html
 * <app-component [input]="value" (output)="handler($event)" />
 * ```
 */
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Entity {
  id: number;
  name: string;
}

@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="component-container">
      <!-- Template content -->
    </div>
  `,
  styles: [`
    .component-container {
      /* Styles */
    }
  `]
})
export class ComponentName {
  private readonly logger = inject(LoggerService);
  
  // Signals
  readonly items = signal<Entity[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Computed
  readonly hasItems = computed(() => this.items().length > 0);
  
  // Methods
  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load data
    } catch (err) {
      this.logger.error('Failed to load data', err);
      this.error.set('Failed to load data');
    } finally {
      this.loading.set(false);
    }
  }
}
```

### Service Pattern

```typescript
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';

export interface Entity {
  id: number;
  name: string;
}

export interface CreateEntityDto {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EntityService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  async getEntities(): Promise<Entity[]> {
    const result = await this.api.call('get_entities', []);
    return result.data as Entity[] || [];
  }

  async createEntity(data: CreateEntityDto): Promise<Entity> {
    const result = await this.api.call('create_entity', [data]);
    return result.data as Entity;
  }

  async updateEntity(id: number, data: Partial<Entity>): Promise<void> {
    await this.api.call('update_entity', [{ id, ...data }]);
  }

  async deleteEntity(id: number): Promise<void> {
    await this.api.call('delete_entity', [{ id }]);
  }
}
```

### Signal Patterns

```typescript
// Writable signals
private readonly loading = signal(false);
private readonly data = signal<T | null>(null);

// Public readonly signals
readonly isLoading = this.loading.asReadonly();
readonly data$ = this.data.asReadonly();

// Computed signals
readonly hasData = computed(() => this.data() !== null);
readonly isEmpty = computed(() => !this.hasData());

// Derived computed
readonly displayData = computed(() => {
  const data = this.data();
  return data ? formatData(data) : null;
});
```

### Error Handling Pattern

```typescript
async loadData(): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  try {
    const result = await this.api.call('get_data', []);
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }
    
    this.data.set(result.data as T);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    this.error.set(message);
    this.logger.error('Failed to load data', err);
    this.notification.showError('Failed to load data');
  } finally {
    this.loading.set(false);
  }
}
```

---

## Architecture Patterns

### Backend Service Layers

```
┌─────────────────────────────────────────────────────────┐
│                    High-level Layer                      │
│  (WebUI, CRUD API, Database Mode)                        │
├─────────────────────────────────────────────────────────┤
│                   Enterprise Layer                       │
│  (Auth, Error Tracking, Updater)                         │
├─────────────────────────────────────────────────────────┤
│                    Database Layer                        │
│  (SQLite, DuckDB, Query Builders)                        │
├─────────────────────────────────────────────────────────┤
│                   Dependent Layer                        │
│  (Config, HTTP)                                          │
├─────────────────────────────────────────────────────────┤
│                  Foundation Layer                        │
│  (Logger, Event, File, Timer, JSON, Hash)                │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rules

1. **Foundation services** have NO dependencies
2. **Dependent services** can only depend on foundation
3. **Database services** have NO service dependencies
4. **Enterprise services** can depend on any lower layer
5. **High-level services** can depend on any layer

### Frontend Component Hierarchy

```
DashboardComponent (root)
├── Sidebar Navigation
└── Content Area
    ├── DuckdbUsersCrudComponent
    ├── DuckdbProductsCrudComponent
    ├── DuckdbOrdersCrudComponent
    └── SqliteCrudComponent
```

### CRUD Component Pattern

```typescript
// All CRUD components extend BaseCrudComponent
export class UsersCrudComponent 
  extends BaseCrudComponent<User, CreateUserDto, UpdateUserDto, UserStats> 
{
  protected readonly entityName = 'User';
  protected readonly apiPrefix = 'crud_';
  
  protected mapApiData(data: unknown): User {
    return data as User;
  }
}
```

---

## Code Organization

### Backend Module Structure

```c
/* Header guard pattern */
#ifndef MODULE_NAME_H
#define MODULE_NAME_H

/* Includes (ordered) */
#include "di/di.h"              /* DI system */
#include "core/base_service.h"  /* Base utilities */
#include <system_header.h>      /* System headers */

/* Type definitions */
typedef enum { ... } TypeName;

/* Service declarations */
DI_DECLARE_SERVICE(ServiceType, service_name);

/* Public API */
ServiceResult function(ServiceType* self, int arg);

#endif
```

### Frontend Module Structure

```typescript
// Barrel exports (index.ts)
export * from './api.service';
export * from './logger.service';
export * from './base-crud.component';
export * from './ui-components';
```

---

## Testing Guidelines

### Backend Test Pattern

```c
#include "di/di.h"
#include "services/logger_service.h"
#include <assert.h>

void test_logger_init() {
    printf("Test: logger_init... ");
    
    LoggerService* logger = logger_service_inject();
    assert(logger != NULL);
    
    printf("PASS\n");
}

void test_logger_log() {
    printf("Test: logger_log... ");
    
    LoggerService* logger = logger_service_inject();
    
    /* Should not crash */
    logger_log(logger, "INFO", "Test message");
    
    printf("PASS\n");
}

int main() {
    printf("Running Logger Tests...\n\n");
    
    test_logger_init();
    test_logger_log();
    
    printf("\nAll tests passed!\n");
    return 0;
}
```

### Frontend Test Pattern

```typescript
import { TestBed } from '@angular/core/testing';
import { ComponentName } from './component-name.component';
import { ApiService } from '../../core/api.service';

describe('ComponentNameComponent', () => {
  let component: ComponentName;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['call']);

    await TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', async () => {
    apiSpy.call.and.resolveTo({ success: true, data: [{ id: 1, name: 'Test' }] });

    await component.ngOnInit();
    expect(component.items().length).toBe(1);
  });
});
```

---

## Documentation Standards

### File Header

```c
/**
 * @file file_name.c
 * @brief Brief description (one line)
 * 
 * Detailed description if needed.
 * 
 * @author Author Name
 * @date 2026-03-30
 */
```

### Function Documentation

```c
/**
 * @brief Brief function description
 * @param self Service instance
 * @param param1 Parameter description
 * @param param2 Parameter description
 * @return Result code description
 * 
 * @code
 * // Usage example:
 * ServiceResult result = function(service, arg1, arg2);
 * if (result_is_ok(result)) {
 *     // Handle success
 * }
 * @endcode
 */
ServiceResult function(ServiceType* self, int param1, const char* param2);
```

### TypeScript Documentation

```typescript
/**
 * Service description
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * @example
 * ```typescript
 * const service = inject(MyService);
 * await service.method(arg);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MyService {
  /**
   * Method description
   * @param param Parameter description
   * @returns Result description
   */
  async method(param: string): Promise<void> {
    // Implementation
  }
}
```

---

## Quick Reference

### Common Macros

```c
/* Backend */
DEFINE_SERVICE(Type, name, PREFIX)
VALIDATE_PTR(ptr, code)
SAFE_ALLOC(type, count)
LOG_INFO(logger, fmt, ...)
RETURN_IF_ERROR(cond, code, msg)
```

### Common Patterns

```typescript
// Frontend
const data = signal<T[]>([]);
const loading = signal(false);
const hasData = computed(() => data().length > 0);

async loadData() {
  loading.set(true);
  try { /* ... */ } 
  finally { loading.set(false); }
}
```

---

## Resources

- [Backend Services](../../docs/backend/services/)
- [Frontend Components](../../frontend/src/views/)
- [API Reference](../../docs/backend/services/crud-api.md)
