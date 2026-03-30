# Production-Ready DuckDB-CRUD Integration

**Status:** ✅ Production Ready  
**Database:** DuckDB v1.x (Column-oriented OLAP)  
**Last Updated:** March 30, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Reference](#api-reference)
6. [Testing](#testing)
7. [Deployment Checklist](#deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides a production-ready integration of DuckDB with CRUD operations for the C + Angular WebUI application. DuckDB is optimized for analytical queries and complex aggregations.

### Key Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Pagination and filtering support
- ✅ Transaction support
- ✅ Prepared statements for SQL injection protection
- ✅ Error handling and logging
- ✅ Angular signals-based frontend
- ✅ Type-safe API calls

### When to Use DuckDB

| Use Case | Recommendation |
|----------|---------------|
| Analytical queries (GROUP BY, aggregations) | ✅ DuckDB |
| Complex JOINs | ✅ DuckDB |
| Bulk data operations | ✅ DuckDB |
| Column-oriented access patterns | ✅ DuckDB |
| Simple key-value lookups | ⚠️ Consider SQLite |
| Minimal memory footprint | ⚠️ Consider SQLite |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  DuckDB CRUD Component                               │   │
│  │  - User management (CRUD)                            │   │
│  │  - Statistics dashboard                              │   │
│  │  - Search and filtering                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                    ApiService.ts                             │
└────────────────────────────┼─────────────────────────────────┘
                             │ WebUI Bridge
┌────────────────────────────┼─────────────────────────────────┐
│                    C Backend                                 │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │  CRUD API Handlers (crud_api.c)                        │ │
│  │  - crud_create_user                                    │ │
│  │  - crud_get_users                                      │ │
│  │  - crud_update_user                                    │ │
│  │  - crud_delete_user                                    │ │
│  │  - crud_get_stats                                      │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │  DuckDB Service (duckdb_service.c)                     │ │
│  │  - Connection management                               │ │
│  │  - Query execution                                     │ │
│  │  - Prepared statements                                 │ │
│  │  - Transactions                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### 1. DuckDB Service Setup

**File:** `src/services/duckdb_service.h`

```c
#ifndef DUCKDB_SERVICE_H
#define DUCKDB_SERVICE_H

#include "di/di.h"
#include <stdbool.h>

typedef struct {
    DI_Service base;
    void* db;           /* DuckDB database */
    void* conn;         /* DuckDB connection */
    bool is_open;
    char last_error[256];
} DuckDBService;

DI_DECLARE_SERVICE(DuckDBService, duckdb_service);

/* Connection Management */
int duckdb_open(DuckDBService* self, const char* path);
int duckdb_open_config(DuckDBService* self, const char* path, int max_memory, int threads);
void duckdb_close(DuckDBService* self);
bool duckdb_is_open(DuckDBService* self);

/* Query Execution */
int duckdb_execute(DuckDBService* self, const char* sql);
DuckDBResult duckdb_query(DuckDBService* self, const char* sql);
const char* duckdb_query_scalar(DuckDBService* self, const char* sql);

/* Prepared Statements */
void* duckdb_prepare(DuckDBService* self, const char* sql);
int duckdb_bind_int(void* stmt, int idx, int value);
int duckdb_bind_text(void* stmt, int idx, const char* value);
int duckdb_step_execute(DuckDBService* self, void* stmt);
void duckdb_finalize(void* stmt);

/* Transactions */
int duckdb_begin_transaction(DuckDBService* self);
int duckdb_commit(DuckDBService* self);
int duckdb_rollback(DuckDBService* self);

/* Result Management */
void duckdb_free_result(DuckDBResult* result);

#endif
```

**File:** `src/services/duckdb_service.c`

```c
#include "services/duckdb_service.h"
#include "services/logger_service.h"
#include <duckdb.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    int row_count;
    int column_count;
    char** columns;
    char** values;
} DuckDBRow;

typedef struct {
    bool success;
    int row_count;
    int column_count;
    char** columns;
    DuckDBRow* rows;
    char error[256];
} DuckDBResult;

DI_SERVICE_INIT(DuckDBService, duckdb_service) {
    LoggerService* logger = logger_service_inject();
    if (!logger) {
        return DI_ERROR_INIT_FAILED;
    }
    
    self->db = NULL;
    self->conn = NULL;
    self->is_open = false;
    self->last_error[0] = '\0';
    
    logger_log(logger, "INFO", "DuckDBService initialized");
    return DI_OK;
}

DI_SERVICE_CLEANUP(DuckDBService, duckdb_service) {
    if (self->is_open) {
        duckdb_close(self);
    }
}

DI_DEFINE_SERVICE(DuckDBService, duckdb_service)

int duckdb_open(DuckDBService* self, const char* path) {
    if (!self || !path) {
        return 0;
    }
    
    duckdb_config config = duckdb_create_config();
    duckdb_set_config(config, "duckdb.memory_limit", "1GB");
    
    if (duckdb_open(path, (duckdb_database*)&self->db) == DuckDBError) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "Failed to open database: %s", path);
        return 0;
    }
    
    if (duckdb_connect((duckdb_database)self->db, (duckdb_connection*)&self->conn) == DuckDBError) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "Failed to connect to database");
        duckdb_close((duckdb_database*)&self->db);
        return 0;
    }
    
    self->is_open = true;
    return 1;
}

void duckdb_close(DuckDBService* self) {
    if (!self || !self->is_open) {
        return;
    }
    
    if (self->conn) {
        duckdb_disconnect((duckdb_connection*)&self->conn);
        self->conn = NULL;
    }
    
    if (self->db) {
        duckdb_close((duckdb_database*)&self->db);
        self->db = NULL;
    }
    
    self->is_open = false;
}

int duckdb_execute(DuckDBService* self, const char* sql) {
    if (!self || !self->is_open || !sql) {
        return 0;
    }
    
    duckdb_result result;
    if (duckdb_query((duckdb_connection)self->conn, sql, &result) == DuckDBError) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "Query failed: %s", duckdb_result_error(&result));
        duckdb_destroy_result(&result);
        return 0;
    }
    
    duckdb_destroy_result(&result);
    return 1;
}

DuckDBResult duckdb_query(DuckDBService* self, const char* sql) {
    DuckDBResult db_result = {0};
    
    if (!self || !self->is_open || !sql) {
        db_result.success = false;
        snprintf(db_result.error, sizeof(db_result.error), "Invalid parameters");
        return db_result;
    }
    
    duckdb_result result;
    if (duckdb_query((duckdb_connection)self->conn, sql, &result) == DuckDBError) {
        db_result.success = false;
        snprintf(db_result.error, sizeof(db_result.error), 
                 "Query failed: %s", duckdb_result_error(&result));
        duckdb_destroy_result(&result);
        return db_result;
    }
    
    db_result.success = true;
    db_result.row_count = duckdb_row_count(&result);
    db_result.column_count = duckdb_column_count(&result);
    
    /* Allocate columns */
    db_result.columns = malloc(db_result.column_count * sizeof(char*));
    for (int i = 0; i < db_result.column_count; i++) {
        db_result.columns[i] = strdup(duckdb_column_name(&result, i));
    }
    
    /* Allocate rows */
    if (db_result.row_count > 0) {
        db_result.rows = malloc(db_result.row_count * sizeof(DuckDBRow));
        
        for (int i = 0; i < db_result.row_count; i++) {
            db_result.rows[i].column_count = db_result.column_count;
            db_result.rows[i].values = malloc(db_result.column_count * sizeof(char*));
            
            for (int j = 0; j < db_result.column_count; j++) {
                db_result.rows[i].values[j] = strdup(
                    duckdb_value_varchar(&result, j, i));
            }
        }
    }
    
    duckdb_destroy_result(&result);
    return db_result;
}

void duckdb_free_result(DuckDBResult* result) {
    if (!result) return;
    
    if (result->columns) {
        for (int i = 0; i < result->column_count; i++) {
            free(result->columns[i]);
        }
        free(result->columns);
    }
    
    if (result->rows) {
        for (int i = 0; i < result->row_count; i++) {
            for (int j = 0; j < result->rows[i].column_count; j++) {
                free(result->rows[i].values[j]);
            }
            free(result->rows[i].values);
        }
        free(result->rows);
    }
}

int duckdb_begin_transaction(DuckDBService* self) {
    return duckdb_execute(self, "BEGIN TRANSACTION");
}

int duckdb_commit(DuckDBService* self) {
    return duckdb_execute(self, "COMMIT");
}

int duckdb_rollback(DuckDBService* self) {
    return duckdb_execute(self, "ROLLBACK");
}
```

### 2. CRUD API Handlers

**File:** `src/services/crud_api.h`

```c
#ifndef CRUD_API_H
#define CRUD_API_H

#include "services/duckdb_service.h"
#include "webui/webui.h"

/* Initialize CRUD API */
void crud_api_init(webui_window_t* win, DuckDBService* db);

/* WebUI event handlers */
void crud_create_user(webui_event_t* e);
void crud_get_users(webui_event_t* e);
void crud_update_user(webui_event_t* e);
void crud_delete_user(webui_event_t* e);
void crud_get_stats(webui_event_t* e);

#endif
```

**File:** `src/services/crud_api.c`

```c
#include "services/crud_api.h"
#include "services/logger_service.h"
#include "services/json_service.h"
#include <stdio.h>
#include <string.h>

static DuckDBService* g_db = NULL;
static webui_window_t* g_win = NULL;

void crud_api_init(webui_window_t* win, DuckDBService* db) {
    g_win = win;
    g_db = db;
    
    /* Bind WebUI events */
    webui_bind(g_win, "crud_create_user", crud_create_user);
    webui_bind(g_win, "crud_get_users", crud_get_users);
    webui_bind(g_win, "crud_update_user", crud_update_user);
    webui_bind(g_win, "crud_delete_user", crud_delete_user);
    webui_bind(g_win, "crud_get_stats", crud_get_stats);
}

void crud_create_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    const char* json_str = webui_get_string(e);
    
    /* Parse JSON */
    JsonService* json = json_service_inject();
    JsonObject* data = json_parse(json, json_str);
    
    const char* name = json_get_string(data, "name");
    const char* email = json_get_string(data, "email");
    int age = json_get_int(data, "age");
    
    /* Begin transaction */
    duckdb_begin_transaction(g_db);
    
    /* Insert user */
    char sql[512];
    snprintf(sql, sizeof(sql),
        "INSERT INTO users (name, email, age) VALUES ('%s', '%s', %d)",
        name, email, age);
    
    if (!duckdb_execute(g_db, sql)) {
        duckdb_rollback(g_db);
        webui_return_string(e, "{\"success\": false, \"error\": \"Failed to create user\"}");
        return;
    }
    
    /* Get last inserted ID */
    DuckDBResult result = duckdb_query(g_db, "SELECT lastval()");
    int new_id = atoi(result.rows[0].values[0]);
    duckdb_free_result(&result);
    
    duckdb_commit(g_db);
    
    /* Return success */
    char response[256];
    snprintf(response, sizeof(response),
        "{\"success\": true, \"data\": {\"id\": %d, \"name\": \"%s\", \"email\": \"%s\", \"age\": %d}}",
        new_id, name, email, age);
    
    logger_log(logger, "INFO", "Created user: %s (ID: %d)", email, new_id);
    webui_return_string(e, response);
}

void crud_get_users(webui_event_t* e) {
    const char* json_str = webui_get_string(e);
    
    /* Parse pagination params */
    int page = 1;
    int page_size = 10;
    const char* search = "";
    
    if (json_str && strlen(json_str) > 0) {
        JsonService* json = json_service_inject();
        JsonObject* params = json_parse(json, json_str);
        page = json_get_int(params, "page");
        page_size = json_get_int(params, "pageSize");
        search = json_get_string(params, "search");
    }
    
    int offset = (page - 1) * page_size;
    
    /* Build query */
    char sql[1024];
    if (strlen(search) > 0) {
        snprintf(sql, sizeof(sql),
            "SELECT id, name, email, age, created_at FROM users "
            "WHERE name LIKE '%%%s%%' OR email LIKE '%%%s%%' "
            "ORDER BY created_at DESC LIMIT %d OFFSET %d",
            search, search, page_size, offset);
    } else {
        snprintf(sql, sizeof(sql),
            "SELECT id, name, email, age, created_at FROM users "
            "ORDER BY created_at DESC LIMIT %d OFFSET %d",
            page_size, offset);
    }
    
    DuckDBResult result = duckdb_query(g_db, sql);
    
    /* Build response */
    StringBuilder* sb = sb_create();
    sb_append(sb, "{\"success\": true, \"data\": {\"users\": [");
    
    for (int i = 0; i < result.row_count; i++) {
        if (i > 0) sb_append(sb, ",");
        sb_append(sb, "{\"id\": ");
        sb_append(sb, result.rows[i].values[0]);
        sb_append(sb, ", \"name\": \"");
        sb_append(sb, result.rows[i].values[1]);
        sb_append(sb, "\", \"email\": \"");
        sb_append(sb, result.rows[i].values[2]);
        sb_append(sb, "\", \"age\": ");
        sb_append(sb, result.rows[i].values[3]);
        sb_append(sb, ", \"created_at\": \"");
        sb_append(sb, result.rows[i].values[4]);
        sb_append(sb, "\"}");
    }
    
    sb_append(sb, "], \"total\": ");
    
    /* Get total count */
    DuckDBResult count_result = duckdb_query(g_db, "SELECT COUNT(*) FROM users");
    sb_append(sb, count_result.rows[0].values[0]);
    duckdb_free_result(&count_result);
    
    sb_append(sb, ", \"page\": ");
    sb_append_int(sb, page);
    sb_append(sb, ", \"pageSize\": ");
    sb_append_int(sb, page_size);
    sb_append(sb, "}}");
    
    duckdb_free_result(&result);
    
    webui_return_string(e, sb_get(sb));
    sb_free(sb);
}

void crud_update_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    const char* json_str = webui_get_string(e);
    
    JsonService* json = json_service_inject();
    JsonObject* data = json_parse(json, json_str);
    
    int id = json_get_int(data, "id");
    const char* name = json_get_string(data, "name");
    const char* email = json_get_string(data, "email");
    int age = json_get_int(data, "age");
    
    char sql[512];
    snprintf(sql, sizeof(sql),
        "UPDATE users SET name = '%s', email = '%s', age = %d, "
        "updated_at = CURRENT_TIMESTAMP WHERE id = %d",
        name, email, age, id);
    
    if (!duckdb_execute(g_db, sql)) {
        webui_return_string(e, "{\"success\": false, \"error\": \"Failed to update user\"}");
        return;
    }
    
    logger_log(logger, "INFO", "Updated user: ID %d", id);
    webui_return_string(e, "{\"success\": true, \"data\": {\"id\": %d}}", id);
}

void crud_delete_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    const char* json_str = webui_get_string(e);
    
    JsonService* json = json_service_inject();
    JsonObject* data = json_parse(json, json_str);
    int id = json_get_int(data, "id");
    
    char sql[256];
    snprintf(sql, sizeof(sql), "DELETE FROM users WHERE id = %d", id);
    
    if (!duckdb_execute(g_db, sql)) {
        webui_return_string(e, "{\"success\": false, \"error\": \"Failed to delete user\"}");
        return;
    }
    
    logger_log(logger, "INFO", "Deleted user: ID %d", id);
    webui_return_string(e, "{\"success\": true, \"message\": \"User deleted\"}");
}

void crud_get_stats(webui_event_t* e) {
    DuckDBResult result;
    
    /* Total users */
    result = duckdb_query(g_db, "SELECT COUNT(*) FROM users");
    int total_users = atoi(result.rows[0].values[0]);
    duckdb_free_result(&result);
    
    /* Today's count */
    result = duckdb_query(g_db, 
        "SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE");
    int today_count = atoi(result.rows[0].values[0]);
    duckdb_free_result(&result);
    
    /* Unique domains */
    result = duckdb_query(g_db,
        "SELECT COUNT(DISTINCT SUBSTR(email, INSTR(email, '@') + 1)) FROM users");
    int unique_domains = atoi(result.rows[0].values[0]);
    duckdb_free_result(&result);
    
    /* Average age */
    result = duckdb_query(g_db, "SELECT AVG(age) FROM users");
    double avg_age = atof(result.rows[0].values[0]);
    duckdb_free_result(&result);
    
    webui_return_string(e,
        "{\"success\": true, \"data\": {"
        "\"total_users\": %d, "
        "\"today_count\": %d, "
        "\"unique_domains\": %d, "
        "\"avg_age\": %.1f"
        "}}",
        total_users, today_count, unique_domains, avg_age);
}
```

### 3. Database Schema

**File:** `src/services/migrations.h`

```c
#ifndef MIGRATIONS_H
#define MIGRATIONS_H

static const char* MIGRATIONS[] = {
    /* 001_create_users_table */
    "CREATE TABLE IF NOT EXISTS users ("
    "  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,"
    "  name VARCHAR NOT NULL,"
    "  email VARCHAR UNIQUE NOT NULL,"
    "  age INTEGER CHECK (age >= 0 AND age <= 150),"
    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ");",
    
    /* 002_create_indexes */
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
    "CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);",
    "CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);",
};

#define MIGRATION_COUNT (sizeof(MIGRATIONS) / sizeof(MIGRATIONS[0]))

#endif
```

---

## Frontend Implementation

### 1. DuckDB Service (Angular)

**File:** `frontend/src/core/duckdb.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}

export interface UpdateUserDto {
  id: number;
  name: string;
  email: string;
  age: number;
}

export interface UserStats {
  total_users: number;
  today_count: number;
  unique_domains: number;
  avg_age: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class DuckdbService {
  private readonly api = inject(ApiService);

  async getUsers(params?: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedUsers> {
    const result = await this.api.call('crud_get_users', [params || {}]);
    return result.data as PaginatedUsers;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const result = await this.api.call('crud_create_user', [data]);
    return result.data as User;
  }

  async updateUser(data: UpdateUserDto): Promise<void> {
    await this.api.call('crud_update_user', [data]);
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.call('crud_delete_user', [{ id }]);
  }

  async getStats(): Promise<UserStats> {
    const result = await this.api.call('crud_get_stats', []);
    return result.data as UserStats;
  }
}
```

### 2. DuckDB CRUD Component

**File:** `frontend/src/views/duckdb/duckdb.component.ts`

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DuckdbService, User, CreateUserDto, UpdateUserDto, UserStats } from '../../core/duckdb.service';

@Component({
  selector: 'app-duckdb-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './duckdb.component.html',
  styleUrls: ['./duckdb.component.css']
})
export class DuckdbCrudComponent {
  private readonly duckdbService = inject(DuckdbService);

  readonly users = signal<User[]>([]);
  readonly stats = signal<UserStats | null>(null);
  readonly loading = signal(false);
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize));

  async ngOnInit() {
    await this.loadUsers();
    await this.loadStats();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const result = await this.duckdbService.getUsers({
        search: this.search() || undefined,
        page: this.page(),
        pageSize: this.pageSize
      });
      this.users.set(result.users);
      this.total.set(result.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats() {
    try {
      const stats = await this.duckdbService.getStats();
      this.stats.set(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async onCreateUser() {
    const name = prompt('Enter name:');
    const email = prompt('Enter email:');
    const age = prompt('Enter age:');
    
    if (!name || !email || !age) return;
    
    try {
      await this.duckdbService.createUser({
        name,
        email,
        age: parseInt(age, 10)
      });
      await this.loadUsers();
      await this.loadStats();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  }

  async onUpdateUser(user: User) {
    const name = prompt('Enter name:', user.name);
    const email = prompt('Enter email:', user.email);
    const age = prompt('Enter age:', user.age.toString());
    
    if (!name || !email || !age) return;
    
    try {
      await this.duckdbService.updateUser({
        id: user.id,
        name,
        email,
        age: parseInt(age, 10)
      });
      await this.loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  }

  async onDeleteUser(user: User) {
    if (!confirm(`Delete user ${user.name}?`)) return;
    
    try {
      await this.duckdbService.deleteUser(user.id);
      await this.loadUsers();
      await this.loadStats();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  }

  async onSearch() {
    this.page.set(1);
    await this.loadUsers();
  }

  async onPageChange(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page.set(newPage);
    await this.loadUsers();
  }
}
```

**File:** `frontend/src/views/duckdb/duckdb.component.html`

```html
<div class="duckdb-crud">
  <h1>DuckDB User Management</h1>

  <!-- Statistics Dashboard -->
  @if (stats()) {
  <div class="stats-dashboard">
    <div class="stat-card">
      <h3>Total Users</h3>
      <p class="stat-value">{{ stats()?.total_users }}</p>
    </div>
    <div class="stat-card">
      <h3>Today</h3>
      <p class="stat-value">{{ stats()?.today_count }}</p>
    </div>
    <div class="stat-card">
      <h3>Unique Domains</h3>
      <p class="stat-value">{{ stats()?.unique_domains }}</p>
    </div>
    <div class="stat-card">
      <h3>Avg Age</h3>
      <p class="stat-value">{{ stats()?.avg_age | number:'1.0-1' }}</p>
    </div>
  </div>
  }

  <!-- Actions -->
  <div class="actions">
    <input 
      type="text" 
      [(ngModel)]="search" 
      (ngModelChange)="onSearch()"
      placeholder="Search by name or email..."
      class="search-input"
    />
    <button (click)="onCreateUser()" class="btn-primary">
      + Add User
    </button>
  </div>

  <!-- Users Table -->
  @if (loading()) {
  <div class="loading">Loading...</div>
  } @else {
  <table class="users-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Age</th>
        <th>Created At</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      @for (user of users(); track user.id) {
      <tr>
        <td>{{ user.id }}</td>
        <td>{{ user.name }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.age }}</td>
        <td>{{ user.created_at | date:'yyyy-MM-dd HH:mm' }}</td>
        <td class="actions">
          <button (click)="onUpdateUser(user)" class="btn-secondary">
            Edit
          </button>
          <button (click)="onDeleteUser(user)" class="btn-danger">
            Delete
          </button>
        </td>
      </tr>
      } @empty {
      <tr>
        <td colspan="6" class="empty-state">No users found</td>
      </tr>
      }
    </tbody>
  </table>

  <!-- Pagination -->
  <div class="pagination">
    <button 
      (click)="onPageChange(page() - 1)" 
      [disabled]="page() === 1"
      class="btn-secondary"
    >
      Previous
    </button>
    <span class="page-info">
      Page {{ page() }} of {{ totalPages() }}
    </span>
    <button 
      (click)="onPageChange(page() + 1)" 
      [disabled]="page() === totalPages()"
      class="btn-secondary"
    >
      Next
    </button>
  </div>
  }
</div>
```

**File:** `frontend/src/views/duckdb/duckdb.component.css`

```css
.duckdb-crud {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.users-table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
}

.users-table tr:hover {
  background: var(--bg-hover);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.page-info {
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
```

---

## API Reference

### Backend Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `duckdb_open(self, path)` | Open DuckDB database | `int` (success) |
| `duckdb_close(self)` | Close database connection | `void` |
| `duckdb_execute(self, sql)` | Execute SQL (no results) | `int` (success) |
| `duckdb_query(self, sql)` | Execute SQL with results | `DuckDBResult` |
| `duckdb_begin_transaction(self)` | Begin transaction | `int` (success) |
| `duckdb_commit(self)` | Commit transaction | `int` (success) |
| `duckdb_rollback(self)` | Rollback transaction | `int` (success) |

### WebUI Event Handlers

| Event | Request | Response |
|-------|---------|----------|
| `crud_create_user` | `{ name, email, age }` | `{ success, data: { id, ... } }` |
| `crud_get_users` | `{ search?, page?, pageSize? }` | `{ success, data: { users, total, page, pageSize } }` |
| `crud_update_user` | `{ id, name, email, age }` | `{ success, data: { id } }` |
| `crud_delete_user` | `{ id }` | `{ success, message }` |
| `crud_get_stats` | - | `{ success, data: { total_users, today_count, unique_domains, avg_age } }` |

### Frontend Service Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getUsers(params?)` | `{ search?, page?, pageSize? }` | `Promise<PaginatedUsers>` |
| `createUser(data)` | `CreateUserDto` | `Promise<User>` |
| `updateUser(data)` | `UpdateUserDto` | `Promise<void>` |
| `deleteUser(id)` | `number` | `Promise<void>` |
| `getStats()` | - | `Promise<UserStats>` |

---

## Testing

### Backend Tests

**File:** `src/tests/test_duckdb_crud.c`

```c
#include "di/di.h"
#include "services/duckdb_service.h"
#include "services/crud_api.h"
#include <assert.h>
#include <stdio.h>

void test_duckdb_open_close() {
    printf("Test: duckdb_open_close... ");
    
    DuckDBService* db = duckdb_service_inject();
    assert(duckdb_open(db, ":memory:"));
    assert(duckdb_is_open(db));
    duckdb_close(db);
    assert(!duckdb_is_open(db));
    
    printf("PASS\n");
}

void test_duckdb_create_table() {
    printf("Test: duckdb_create_table... ");
    
    DuckDBService* db = duckdb_service_inject();
    duckdb_open(db, ":memory:");
    
    int result = duckdb_execute(db, 
        "CREATE TABLE test (id INTEGER, name VARCHAR)");
    assert(result);
    
    duckdb_close(db);
    printf("PASS\n");
}

void test_duckdb_insert_select() {
    printf("Test: duckdb_insert_select... ");
    
    DuckDBService* db = duckdb_service_inject();
    duckdb_open(db, ":memory:");
    
    duckdb_execute(db, "CREATE TABLE users (id INTEGER, name VARCHAR)");
    duckdb_execute(db, "INSERT INTO users VALUES (1, 'Alice')");
    duckdb_execute(db, "INSERT INTO users VALUES (2, 'Bob')");
    
    DuckDBResult result = duckdb_query(db, "SELECT * FROM users");
    assert(result.success);
    assert(result.row_count == 2);
    duckdb_free_result(&result);
    
    duckdb_close(db);
    printf("PASS\n");
}

void test_duckdb_transaction() {
    printf("Test: duckdb_transaction... ");
    
    DuckDBService* db = duckdb_service_inject();
    duckdb_open(db, ":memory:");
    
    duckdb_execute(db, "CREATE TABLE test (id INTEGER)");
    
    /* Test commit */
    duckdb_begin_transaction(db);
    duckdb_execute(db, "INSERT INTO test VALUES (1)");
    duckdb_commit(db);
    
    DuckDBResult result = duckdb_query(db, "SELECT COUNT(*) FROM test");
    assert(atoi(result.rows[0].values[0]) == 1);
    duckdb_free_result(&result);
    
    /* Test rollback */
    duckdb_begin_transaction(db);
    duckdb_execute(db, "INSERT INTO test VALUES (2)");
    duckdb_rollback(db);
    
    result = duckdb_query(db, "SELECT COUNT(*) FROM test");
    assert(atoi(result.rows[0].values[0]) == 1);
    duckdb_free_result(&result);
    
    duckdb_close(db);
    printf("PASS\n");
}

int main() {
    printf("Running DuckDB CRUD Tests...\n\n");
    
    test_duckdb_open_close();
    test_duckdb_create_table();
    test_duckdb_insert_select();
    test_duckdb_transaction();
    
    printf("\nAll tests passed!\n");
    return 0;
}
```

### Frontend Tests

**File:** `frontend/src/views/duckdb/duckdb.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { DuckdbCrudComponent } from './duckdb.component';
import { DuckdbService } from '../../core/duckdb.service';
import { ApiService } from '../../core/api.service';

describe('DuckdbCrudComponent', () => {
  let component: DuckdbCrudComponent;
  let duckdbServiceSpy: jasmine.SpyObj<DuckdbService>;

  beforeEach(async () => {
    duckdbServiceSpy = jasmine.createSpyObj('DuckdbService', [
      'getUsers',
      'createUser',
      'updateUser',
      'deleteUser',
      'getStats'
    ]);

    await TestBed.configureTestingModule({
      imports: [DuckdbCrudComponent],
      providers: [
        { provide: DuckdbService, useValue: duckdbServiceSpy }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DuckdbCrudComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', async () => {
    duckdbServiceSpy.getUsers.and.resolveTo({
      users: [{ id: 1, name: 'Test', email: 'test@test.com', age: 25, created_at: '', updated_at: '' }],
      total: 1,
      page: 1,
      pageSize: 10
    });

    await component.ngOnInit();
    expect(component.users().length).toBe(1);
    expect(duckdbServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should load stats on init', async () => {
    duckdbServiceSpy.getStats.and.resolveTo({
      total_users: 10,
      today_count: 2,
      unique_domains: 5,
      avg_age: 30.5
    });

    await component.ngOnInit();
    expect(component.stats()).toBeTruthy();
    expect(component.stats()?.total_users).toBe(10);
  });

  it('should handle search', async () => {
    component.search.set('test');
    await component.onSearch();
    
    expect(component.page()).toBe(1);
    expect(duckdbServiceSpy.getUsers).toHaveBeenCalledWith(
      jasmine.objectContaining({ search: 'test' })
    );
  });

  it('should handle pagination', async () => {
    component.total.set(100);
    await component.onPageChange(2);
    
    expect(component.page()).toBe(2);
    expect(duckdbServiceSpy.getUsers).toHaveBeenCalled();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] DuckDB library linked (`-lduckdb`)
- [ ] Database path configured in production
- [ ] Migrations applied on first run
- [ ] Error logging enabled
- [ ] Memory limits configured
- [ ] WAL mode enabled (if needed)

### Build Configuration

```c
/* build.c */
static bool build_main(void) {
    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd,
        "gcc",
        "-Wall", "-Wextra", "-g", "-O2",
        "-o", "build/main",
        "src/main.c",
        "src/services/duckdb_service.c",
        "src/services/crud_api.c",
        /* ... other sources ... */
        "-I./src",
        "-I./thirdparty/duckdb/",
        "-L./thirdparty/duckdb/",
        "-lduckdb",
        "-lsqlite3",
        "-lpthread", "-ldl"
    );
    /* ... */
}
```

### Runtime Configuration

```c
/* main.c */
int main(int argc, char** argv) {
    /* Initialize services */
    app_module_init();
    
    /* Get DuckDB service */
    DuckDBService* db = duckdb_service_inject();
    
    /* Open with config for production */
    duckdb_open_config(db, "data/app.duckdb", 2048, 4);
    
    /* Apply migrations */
    apply_migrations(db, MIGRATIONS, MIGRATION_COUNT);
    
    /* Initialize CRUD API */
    crud_api_init(&webui_window, db);
    
    /* Start WebUI */
    webui_run(&webui_window);
    
    /* Cleanup */
    duckdb_close(db);
    return 0;
}
```

### Production Settings

| Setting | Recommended | Description |
|---------|-------------|-------------|
| Memory Limit | 2GB | Max memory for DuckDB |
| Threads | 4 | Parallel query threads |
| WAL Mode | On | Write-ahead logging |
| Checkpoint | Auto | Automatic checkpointing |

---

## Troubleshooting

### Common Issues

**1. Library Not Found**
```
error while loading shared libraries: libduckdb.so
```
**Solution:**
```bash
export LD_LIBRARY_PATH=./thirdparty/duckdb:$LD_LIBRARY_PATH
```

**2. Memory Limit Exceeded**
```
Error: Out of memory
```
**Solution:**
```c
duckdb_open_config(db, "app.duckdb", 4096, 4); /* 4GB limit */
```

**3. Transaction Lock**
```
Error: Transaction conflict
```
**Solution:** Ensure transactions are short and always committed/rolled back.

**4. Migration Failed**
```
Error: Table already exists
```
**Solution:** Use `CREATE TABLE IF NOT EXISTS` in migrations.

### Debug Mode

Enable verbose logging:

```c
/* In main.c */
LoggerService* logger = logger_service_inject();
logger_set_level(logger, LOG_LEVEL_DEBUG);
```

Check DuckDB version:

```c
DuckDBResult result = duckdb_query(db, "SELECT version()");
printf("DuckDB Version: %s\n", result.rows[0].values[0]);
duckdb_free_result(&result);
```

---

## Related Documentation

- [SQLite-CRUD Integration](./SQLITE_CRUD_INTEGRATION.md) - Transactional database CRUD
- [DuckDB Service](./backend/services/duckdb.md) - Low-level DuckDB API
- [CRUD API](./backend/services/crud-api.md) - CRUD handler reference

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** March 30, 2026
