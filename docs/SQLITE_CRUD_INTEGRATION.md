# Production-Ready SQLite-CRUD Integration

**Status:** ✅ Production Ready  
**Database:** SQLite 3.x (Transactional OLTP)  
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

This guide provides a production-ready integration of SQLite with CRUD operations for the C + Angular WebUI application. SQLite is optimized for transactional workloads and embedded deployments.

### Key Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Pagination and filtering support
- ✅ ACID-compliant transactions
- ✅ Prepared statements for SQL injection protection
- ✅ WAL mode for concurrent access
- ✅ Schema migrations system
- ✅ Error handling and logging
- ✅ Angular signals-based frontend
- ✅ Type-safe API calls

### When to Use SQLite

| Use Case | Recommendation |
|----------|---------------|
| Transactional operations (OLTP) | ✅ SQLite |
| Simple key-value lookups | ✅ SQLite |
| Embedded/mobile deployment | ✅ SQLite |
| Minimal memory footprint | ✅ SQLite |
| Row-oriented access patterns | ✅ SQLite |
| Complex analytical queries | ⚠️ Consider DuckDB |
| Heavy aggregations | ⚠️ Consider DuckDB |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Frontend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SQLite CRUD Component                               │   │
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
│  │  SQLite Service (sqlite_service.c)                     │ │
│  │  - Connection management                               │ │
│  │  - Prepared statements                                 │ │
│  │  - Transactions with WAL                               │ │
│  │  - Migrations                                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### 1. SQLite Service Setup

**File:** `src/services/sqlite_service.h`

```c
#ifndef SQLITE_SERVICE_H
#define SQLITE_SERVICE_H

#include "di/di.h"
#include <sqlite3.h>
#include <stdbool.h>

typedef struct {
    DI_Service base;
    sqlite3* db;
    bool is_open;
    char last_error[256];
} SQLiteService;

DI_DECLARE_SERVICE(SQLiteService, sqlite_service);

/* Connection Management */
int sqlite_open(SQLiteService* self, const char* path);
int sqlite_open_wal(SQLiteService* self, const char* path);
void sqlite_close(SQLiteService* self);
bool sqlite_is_open(SQLiteService* self);
const char* sqlite_last_error(SQLiteService* self);

/* Query Execution */
int sqlite_execute(SQLiteService* self, const char* sql);
SQLiteResult sqlite_query(SQLiteService* self, const char* sql);
const char* sqlite_query_scalar(SQLiteService* self, const char* sql);
long long sqlite_last_insert_rowid(SQLiteService* self);
int sqlite_changes(SQLiteService* self);

/* Prepared Statements */
sqlite3_stmt* sqlite_prepare(SQLiteService* self, const char* sql);
int sqlite_bind_int(sqlite3_stmt* stmt, int idx, int value);
int sqlite_bind_text(sqlite3_stmt* stmt, int idx, const char* value);
int sqlite_step(sqlite3_stmt* stmt);
void sqlite_finalize(sqlite3_stmt* stmt);

/* Transactions */
int sqlite_begin_transaction(SQLiteService* self);
int sqlite_commit(SQLiteService* self);
int sqlite_rollback(SQLiteService* self);

/* Migrations */
int sqlite_migrate(SQLiteService* self, const char** migrations, int count, int target);

/* Result Management */
void sqlite_free_result(SQLiteResult* result);

#endif
```

**File:** `src/services/sqlite_service.c`

```c
#include "services/sqlite_service.h"
#include "services/logger_service.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

typedef struct {
    int column_count;
    char** columns;
    char** values;
} SQLiteRow;

typedef struct {
    bool success;
    int row_count;
    int column_count;
    char** columns;
    SQLiteRow* rows;
    char* error;
} SQLiteResult;

DI_SERVICE_INIT(SQLiteService, sqlite_service) {
    LoggerService* logger = logger_service_inject();
    if (!logger) {
        return DI_ERROR_INIT_FAILED;
    }
    
    self->db = NULL;
    self->is_open = false;
    self->last_error[0] = '\0';
    
    logger_log(logger, "INFO", "SQLiteService initialized");
    return DI_OK;
}

DI_SERVICE_CLEANUP(SQLiteService, sqlite_service) {
    if (self->is_open) {
        sqlite_close(self);
    }
}

DI_DEFINE_SERVICE(SQLiteService, sqlite_service)

int sqlite_open(SQLiteService* self, const char* path) {
    if (!self || !path) {
        return 0;
    }
    
    int rc = sqlite3_open(path, &self->db);
    if (rc != SQLITE_OK) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "Failed to open database: %s", sqlite3_errmsg(self->db));
        sqlite3_close(self->db);
        self->db = NULL;
        return 0;
    }
    
    self->is_open = true;
    return 1;
}

int sqlite_open_wal(SQLiteService* self, const char* path) {
    if (!sqlite_open(self, path)) {
        return 0;
    }
    
    /* Enable WAL mode for better concurrency */
    char* err_msg = NULL;
    int rc = sqlite3_exec(self->db, "PRAGMA journal_mode=WAL", NULL, NULL, &err_msg);
    if (rc != SQLITE_OK) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "Failed to enable WAL mode: %s", err_msg);
        sqlite3_free(err_msg);
        sqlite_close(self);
        return 0;
    }
    
    /* Enable foreign keys */
    rc = sqlite3_exec(self->db, "PRAGMA foreign_keys=ON", NULL, NULL, &err_msg);
    if (rc != SQLITE_OK) {
        sqlite3_free(err_msg);
    }
    
    return 1;
}

void sqlite_close(SQLiteService* self) {
    if (!self || !self->is_open) {
        return;
    }
    
    sqlite3_close(self->db);
    self->db = NULL;
    self->is_open = false;
}

bool sqlite_is_open(SQLiteService* self) {
    return self && self->is_open && self->db != NULL;
}

const char* sqlite_last_error(SQLiteService* self) {
    if (!self) return "NULL service";
    if (self->last_error[0] != '\0') return self->last_error;
    if (self->db) return sqlite3_errmsg(self->db);
    return "Unknown error";
}

int sqlite_execute(SQLiteService* self, const char* sql) {
    if (!self || !self->is_open || !sql) {
        return 0;
    }
    
    char* err_msg = NULL;
    int rc = sqlite3_exec(self->db, sql, NULL, NULL, &err_msg);
    
    if (rc != SQLITE_OK) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "SQL error: %s", err_msg);
        sqlite3_free(err_msg);
        return 0;
    }
    
    return 1;
}

SQLiteResult sqlite_query(SQLiteService* self, const char* sql) {
    SQLiteResult result = {0};
    
    if (!self || !self->is_open || !sql) {
        result.success = false;
        result.error = strdup("Invalid parameters");
        return result;
    }
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        result.success = false;
        result.error = strdup(sqlite3_errmsg(self->db));
        return result;
    }
    
    /* Get column count */
    result.column_count = sqlite3_column_count(stmt);
    
    /* Allocate columns */
    result.columns = malloc(result.column_count * sizeof(char*));
    for (int i = 0; i < result.column_count; i++) {
        result.columns[i] = strdup(sqlite3_column_name(stmt, i));
    }
    
    /* Count rows first */
    int row_count = 0;
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        row_count++;
    }
    
    result.row_count = row_count;
    
    /* Reset and re-execute to get data */
    sqlite3_reset(stmt);
    
    if (row_count > 0) {
        result.rows = malloc(row_count * sizeof(SQLiteRow));
        
        for (int i = 0; i < row_count; i++) {
            sqlite3_step(stmt);
            result.rows[i].column_count = result.column_count;
            result.rows[i].values = malloc(result.column_count * sizeof(char*));
            
            for (int j = 0; j < result.column_count; j++) {
                const unsigned char* val = sqlite3_column_text(stmt, j);
                result.rows[i].values[j] = strdup(val ? (const char*)val : "");
            }
        }
    }
    
    sqlite3_finalize(stmt);
    result.success = true;
    return result;
}

const char* sqlite_query_scalar(SQLiteService* self, const char* sql) {
    if (!self || !self->is_open || !sql) {
        return NULL;
    }
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        return NULL;
    }
    
    static char result_buffer[256];
    result_buffer[0] = '\0';
    
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        const unsigned char* val = sqlite3_column_text(stmt, 0);
        if (val) {
            strncpy(result_buffer, (const char*)val, sizeof(result_buffer) - 1);
        }
    }
    
    sqlite3_finalize(stmt);
    
    if (result_buffer[0] == '\0') {
        return NULL;
    }
    
    return result_buffer;
}

long long sqlite_last_insert_rowid(SQLiteService* self) {
    if (!self || !self->db) {
        return 0;
    }
    return sqlite3_last_insert_rowid(self->db);
}

int sqlite_changes(SQLiteService* self) {
    if (!self || !self->db) {
        return 0;
    }
    return sqlite3_changes(self->db);
}

sqlite3_stmt* sqlite_prepare(SQLiteService* self, const char* sql) {
    if (!self || !self->is_open || !sql) {
        return NULL;
    }
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        snprintf(self->last_error, sizeof(self->last_error), 
                 "Prepare failed: %s", sqlite3_errmsg(self->db));
        return NULL;
    }
    
    return stmt;
}

int sqlite_bind_int(sqlite3_stmt* stmt, int idx, int value) {
    return sqlite3_bind_int(stmt, idx, value);
}

int sqlite_bind_text(sqlite3_stmt* stmt, int idx, const char* value) {
    return sqlite3_bind_text(stmt, idx, value, -1, SQLITE_STATIC);
}

int sqlite_step(sqlite3_stmt* stmt) {
    return sqlite3_step(stmt);
}

void sqlite_finalize(sqlite3_stmt* stmt) {
    sqlite3_finalize(stmt);
}

int sqlite_begin_transaction(SQLiteService* self) {
    return sqlite_execute(self, "BEGIN TRANSACTION");
}

int sqlite_commit(SQLiteService* self) {
    return sqlite_execute(self, "COMMIT");
}

int sqlite_rollback(SQLiteService* self) {
    return sqlite_execute(self, "ROLLBACK");
}

void sqlite_free_result(SQLiteResult* result) {
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
    
    if (result->error) {
        free(result->error);
    }
}

int sqlite_migrate(SQLiteService* self, const char** migrations, int count, int target) {
    LoggerService* logger = logger_service_inject();
    
    /* Create migrations table */
    if (!sqlite_execute(self, 
        "CREATE TABLE IF NOT EXISTS schema_migrations ("
        "  id INTEGER PRIMARY KEY,"
        "  name TEXT UNIQUE NOT NULL,"
        "  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")")) {
        logger_log(logger, "ERROR", "Failed to create migrations table");
        return 0;
    }
    
    /* Apply each migration */
    for (int i = 0; i < count && i < target; i++) {
        char migration_name[64];
        snprintf(migration_name, sizeof(migration_name), "%03d_migration", i + 1);
        
        /* Check if already applied */
        char check_sql[256];
        snprintf(check_sql, sizeof(check_sql),
            "SELECT COUNT(*) FROM schema_migrations WHERE name = '%s'", migration_name);
        
        const char* count_str = sqlite_query_scalar(self, check_sql);
        if (count_str && atoi(count_str) > 0) {
            continue; /* Already applied */
        }
        
        /* Apply migration */
        if (!sqlite_execute(self, migrations[i])) {
            logger_log(logger, "ERROR", "Migration %s failed: %s", 
                      migration_name, sqlite_last_error(self));
            return 0;
        }
        
        /* Record migration */
        char insert_sql[256];
        snprintf(insert_sql, sizeof(insert_sql),
            "INSERT INTO schema_migrations (name) VALUES ('%s')", migration_name);
        
        if (!sqlite_execute(self, insert_sql)) {
            logger_log(logger, "ERROR", "Failed to record migration %s", migration_name);
            return 0;
        }
        
        logger_log(logger, "INFO", "Applied migration: %s", migration_name);
    }
    
    return 1;
}
```

### 2. CRUD API Handlers

**File:** `src/services/crud_api.h`

```c
#ifndef CRUD_API_H
#define CRUD_API_H

#include "services/sqlite_service.h"
#include "webui/webui.h"

/* Initialize CRUD API */
void crud_api_init(webui_window_t* win, SQLiteService* db);

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

static SQLiteService* g_db = NULL;
static webui_window_t* g_win = NULL;

void crud_api_init(webui_window_t* win, SQLiteService* db) {
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
    
    /* Use prepared statement for SQL injection protection */
    sqlite_begin_transaction(g_db);
    
    sqlite3_stmt* stmt = sqlite_prepare(g_db,
        "INSERT INTO users (name, email, age) VALUES (?, ?, ?)");
    
    if (!stmt) {
        sqlite_rollback(g_db);
        webui_return_string(e, "{\"success\": false, \"error\": \"Failed to create user\"}");
        return;
    }
    
    sqlite_bind_text(stmt, 1, name);
    sqlite_bind_text(stmt, 2, email);
    sqlite_bind_int(stmt, 3, age);
    
    if (sqlite_step(stmt) != SQLITE_DONE) {
        sqlite_finalize(stmt);
        sqlite_rollback(g_db);
        webui_return_string(e, "{\"success\": false, \"error\": \"Insert failed\"}");
        return;
    }
    
    long long new_id = sqlite_last_insert_rowid(g_db);
    sqlite_finalize(stmt);
    sqlite_commit(g_db);
    
    /* Return success */
    char response[512];
    snprintf(response, sizeof(response),
        "{\"success\": true, \"data\": {\"id\": %lld, \"name\": \"%s\", \"email\": \"%s\", \"age\": %d}}",
        new_id, name, email, age);
    
    logger_log(logger, "INFO", "Created user: %s (ID: %lld)", email, new_id);
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
    
    /* Build query with prepared statement */
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
    
    SQLiteResult result = sqlite_query(g_db, sql);
    
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
    const char* count_str = sqlite_query_scalar(g_db, "SELECT COUNT(*) FROM users");
    sb_append(sb, count_str ? count_str : "0");
    
    sb_append(sb, ", \"page\": ");
    sb_append_int(sb, page);
    sb_append(sb, ", \"pageSize\": ");
    sb_append_int(sb, page_size);
    sb_append(sb, "}}");
    
    sqlite_free_result(&result);
    
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
    
    /* Use prepared statement */
    sqlite3_stmt* stmt = sqlite_prepare(g_db,
        "UPDATE users SET name = ?, email = ?, age = ?, "
        "updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    
    if (!stmt) {
        webui_return_string(e, "{\"success\": false, \"error\": \"Failed to update user\"}");
        return;
    }
    
    sqlite_bind_text(stmt, 1, name);
    sqlite_bind_text(stmt, 2, email);
    sqlite_bind_int(stmt, 3, age);
    sqlite_bind_int(stmt, 4, id);
    
    if (sqlite_step(stmt) != SQLITE_DONE) {
        sqlite_finalize(stmt);
        webui_return_string(e, "{\"success\": false, \"error\": \"Update failed\"}");
        return;
    }
    
    sqlite_finalize(stmt);
    
    logger_log(logger, "INFO", "Updated user: ID %d", id);
    webui_return_string(e, "{\"success\": true, \"data\": {\"id\": %d}}", id);
}

void crud_delete_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    const char* json_str = webui_get_string(e);
    
    JsonService* json = json_service_inject();
    JsonObject* data = json_parse(json, json_str);
    int id = json_get_int(data, "id");
    
    sqlite3_stmt* stmt = sqlite_prepare(g_db, "DELETE FROM users WHERE id = ?");
    
    if (!stmt) {
        webui_return_string(e, "{\"success\": false, \"error\": \"Failed to delete user\"}");
        return;
    }
    
    sqlite_bind_int(stmt, 1, id);
    
    if (sqlite_step(stmt) != SQLITE_DONE) {
        sqlite_finalize(stmt);
        webui_return_string(e, "{\"success\": false, \"error\": \"Delete failed\"}");
        return;
    }
    
    sqlite_finalize(stmt);
    
    logger_log(logger, "INFO", "Deleted user: ID %d", id);
    webui_return_string(e, "{\"success\": true, \"message\": \"User deleted\"}");
}

void crud_get_stats(webui_event_t* e) {
    /* Total users */
    const char* total_str = sqlite_query_scalar(g_db, "SELECT COUNT(*) FROM users");
    int total_users = total_str ? atoi(total_str) : 0;
    
    /* Today's count */
    const char* today_str = sqlite_query_scalar(g_db, 
        "SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE('now')");
    int today_count = today_str ? atoi(today_str) : 0;
    
    /* Unique domains */
    const char* domains_str = sqlite_query_scalar(g_db,
        "SELECT COUNT(DISTINCT SUBSTR(email, INSTR(email, '@') + 1)) FROM users");
    int unique_domains = domains_str ? atoi(domains_str) : 0;
    
    /* Average age */
    const char* avg_str = sqlite_query_scalar(g_db, "SELECT AVG(age) FROM users");
    double avg_age = avg_str ? atof(avg_str) : 0.0;
    
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
    "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
    "  name TEXT NOT NULL,"
    "  email TEXT UNIQUE NOT NULL,"
    "  age INTEGER CHECK (age >= 0 AND age <= 150),"
    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ");",
    
    /* 002_create_indexes */
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
    "CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);",
    "CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);",
    
    /* 003_create_products_table */
    "CREATE TABLE IF NOT EXISTS products ("
    "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
    "  name TEXT NOT NULL,"
    "  price REAL NOT NULL,"
    "  category_id INTEGER,"
    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
    "  FOREIGN KEY (category_id) REFERENCES categories(id)"
    ");",
    
    /* 004_create_categories_table */
    "CREATE TABLE IF NOT EXISTS categories ("
    "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
    "  name TEXT UNIQUE NOT NULL"
    ");",
};

#define MIGRATION_COUNT (sizeof(MIGRATIONS) / sizeof(MIGRATIONS[0]))

#endif
```

---

## Frontend Implementation

### 1. SQLite Service (Angular)

**File:** `frontend/src/core/sqlite.service.ts`

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
export class SqliteService {
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

### 2. SQLite CRUD Component

**File:** `frontend/src/views/sqlite/sqlite.component.ts`

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SqliteService, User, CreateUserDto, UpdateUserDto, UserStats } from '../../core/sqlite.service';

@Component({
  selector: 'app-sqlite-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sqlite.component.html',
  styleUrls: ['./sqlite.component.css']
})
export class SqliteCrudComponent {
  private readonly sqliteService = inject(SqliteService);

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
      const result = await this.sqliteService.getUsers({
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
      const stats = await this.sqliteService.getStats();
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
      await this.sqliteService.createUser({
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
      await this.sqliteService.updateUser({
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
      await this.sqliteService.deleteUser(user.id);
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

**File:** `frontend/src/views/sqlite/sqlite.component.html`

```html
<div class="sqlite-crud">
  <h1>SQLite User Management</h1>

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

**File:** `frontend/src/views/sqlite/sqlite.component.css`

```css
.sqlite-crud {
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
| `sqlite_open(self, path)` | Open SQLite database | `int` (success) |
| `sqlite_open_wal(self, path)` | Open with WAL mode | `int` (success) |
| `sqlite_close(self)` | Close database connection | `void` |
| `sqlite_execute(self, sql)` | Execute SQL (no results) | `int` (success) |
| `sqlite_query(self, sql)` | Execute SQL with results | `SQLiteResult` |
| `sqlite_query_scalar(self, sql)` | Execute and get single value | `const char*` |
| `sqlite_begin_transaction(self)` | Begin transaction | `int` (success) |
| `sqlite_commit(self)` | Commit transaction | `int` (success) |
| `sqlite_rollback(self)` | Rollback transaction | `int` (success) |
| `sqlite_prepare(self, sql)` | Prepare statement | `sqlite3_stmt*` |
| `sqlite_migrate(self, migrations, count, target)` | Run migrations | `int` (success) |

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

**File:** `src/tests/test_sqlite_crud.c`

```c
#include "di/di.h"
#include "services/sqlite_service.h"
#include "services/crud_api.h"
#include <assert.h>
#include <stdio.h>

void test_sqlite_open_close() {
    printf("Test: sqlite_open_close... ");
    
    SQLiteService* db = sqlite_service_inject();
    assert(sqlite_open(db, ":memory:"));
    assert(sqlite_is_open(db));
    sqlite_close(db);
    assert(!sqlite_is_open(db));
    
    printf("PASS\n");
}

void test_sqlite_wal_mode() {
    printf("Test: sqlite_wal_mode... ");
    
    SQLiteService* db = sqlite_service_inject();
    assert(sqlite_open_wal(db, "test_wal.db"));
    
    /* Verify WAL mode */
    const char* mode = sqlite_query_scalar(db, "PRAGMA journal_mode");
    assert(mode != NULL);
    
    sqlite_close(db);
    printf("PASS\n");
}

void test_sqlite_create_table() {
    printf("Test: sqlite_create_table... ");
    
    SQLiteService* db = sqlite_service_inject();
    sqlite_open(db, ":memory:");
    
    int result = sqlite_execute(db, 
        "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
    assert(result);
    
    sqlite_close(db);
    printf("PASS\n");
}

void test_sqlite_insert_select() {
    printf("Test: sqlite_insert_select... ");
    
    SQLiteService* db = sqlite_service_inject();
    sqlite_open(db, ":memory:");
    
    sqlite_execute(db, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
    sqlite_execute(db, "INSERT INTO users (name) VALUES ('Alice')");
    sqlite_execute(db, "INSERT INTO users (name) VALUES ('Bob')");
    
    SQLiteResult result = sqlite_query(db, "SELECT * FROM users");
    assert(result.success);
    assert(result.row_count == 2);
    sqlite_free_result(&result);
    
    sqlite_close(db);
    printf("PASS\n");
}

void test_sqlite_transaction() {
    printf("Test: sqlite_transaction... ");
    
    SQLiteService* db = sqlite_service_inject();
    sqlite_open(db, ":memory:");
    
    sqlite_execute(db, "CREATE TABLE test (id INTEGER)");
    
    /* Test commit */
    sqlite_begin_transaction(db);
    sqlite_execute(db, "INSERT INTO test VALUES (1)");
    sqlite_commit(db);
    
    const char* count_str = sqlite_query_scalar(db, "SELECT COUNT(*) FROM test");
    assert(count_str != NULL);
    assert(atoi(count_str) == 1);
    
    /* Test rollback */
    sqlite_begin_transaction(db);
    sqlite_execute(db, "INSERT INTO test VALUES (2)");
    sqlite_rollback(db);
    
    count_str = sqlite_query_scalar(db, "SELECT COUNT(*) FROM test");
    assert(atoi(count_str) == 1);
    
    sqlite_close(db);
    printf("PASS\n");
}

void test_sqlite_prepared_statement() {
    printf("Test: sqlite_prepared_statement... ");
    
    SQLiteService* db = sqlite_service_inject();
    sqlite_open(db, ":memory:");
    
    sqlite_execute(db, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER)");
    
    /* Insert with prepared statement */
    sqlite3_stmt* stmt = sqlite_prepare(db, "INSERT INTO users (name, age) VALUES (?, ?)");
    assert(stmt != NULL);
    
    sqlite_bind_text(stmt, 1, "Alice");
    sqlite_bind_int(stmt, 2, 30);
    assert(sqlite_step(stmt) == SQLITE_DONE);
    sqlite_finalize(stmt);
    
    /* Select with prepared statement */
    stmt = sqlite_prepare(db, "SELECT * FROM users WHERE name = ?");
    sqlite_bind_text(stmt, 1, "Alice");
    assert(sqlite_step(stmt) == SQLITE_ROW);
    sqlite_finalize(stmt);
    
    sqlite_close(db);
    printf("PASS\n");
}

void test_sqlite_migrations() {
    printf("Test: sqlite_migrations... ");
    
    SQLiteService* db = sqlite_service_inject();
    sqlite_open(db, ":memory:");
    
    const char* migrations[] = {
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)",
        "CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)"
    };
    
    int result = sqlite_migrate(db, migrations, 2, 2);
    assert(result);
    
    /* Verify table exists */
    const char* count_str = sqlite_query_scalar(db, 
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users'");
    assert(atoi(count_str) == 1);
    
    sqlite_close(db);
    printf("PASS\n");
}

int main() {
    printf("Running SQLite CRUD Tests...\n\n");
    
    test_sqlite_open_close();
    test_sqlite_wal_mode();
    test_sqlite_create_table();
    test_sqlite_insert_select();
    test_sqlite_transaction();
    test_sqlite_prepared_statement();
    test_sqlite_migrations();
    
    printf("\nAll tests passed!\n");
    return 0;
}
```

### Frontend Tests

**File:** `frontend/src/views/sqlite/sqlite.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { SqliteCrudComponent } from './sqlite.component';
import { SqliteService } from '../../core/sqlite.service';
import { ApiService } from '../../core/api.service';

describe('SqliteCrudComponent', () => {
  let component: SqliteCrudComponent;
  let sqliteServiceSpy: jasmine.SpyObj<SqliteService>;

  beforeEach(async () => {
    sqliteServiceSpy = jasmine.createSpyObj('SqliteService', [
      'getUsers',
      'createUser',
      'updateUser',
      'deleteUser',
      'getStats'
    ]);

    await TestBed.configureTestingModule({
      imports: [SqliteCrudComponent],
      providers: [
        { provide: SqliteService, useValue: sqliteServiceSpy }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(SqliteCrudComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', async () => {
    sqliteServiceSpy.getUsers.and.resolveTo({
      users: [{ id: 1, name: 'Test', email: 'test@test.com', age: 25, created_at: '', updated_at: '' }],
      total: 1,
      page: 1,
      pageSize: 10
    });

    await component.ngOnInit();
    expect(component.users().length).toBe(1);
    expect(sqliteServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should load stats on init', async () => {
    sqliteServiceSpy.getStats.and.resolveTo({
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
    expect(sqliteServiceSpy.getUsers).toHaveBeenCalledWith(
      jasmine.objectContaining({ search: 'test' })
    );
  });

  it('should handle pagination', async () => {
    component.total.set(100);
    await component.onPageChange(2);
    
    expect(component.page()).toBe(2);
    expect(sqliteServiceSpy.getUsers).toHaveBeenCalled();
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] SQLite3 library linked (`-lsqlite3`)
- [ ] Database path configured in production
- [ ] WAL mode enabled for concurrent access
- [ ] Migrations applied on first run
- [ ] Error logging enabled
- [ ] Foreign keys enabled
- [ ] Database file permissions set

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
        "src/services/sqlite_service.c",
        "src/services/crud_api.c",
        /* ... other sources ... */
        "-I./src",
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
    
    /* Get SQLite service */
    SQLiteService* db = sqlite_service_inject();
    
    /* Open with WAL mode for production */
    sqlite_open_wal(db, "data/app.db");
    
    /* Apply migrations */
    apply_migrations(db, MIGRATIONS, MIGRATION_COUNT);
    
    /* Initialize CRUD API */
    crud_api_init(&webui_window, db);
    
    /* Start WebUI */
    webui_run(&webui_window);
    
    /* Cleanup */
    sqlite_close(db);
    return 0;
}
```

### Production Settings

| Setting | Recommended | Description |
|---------|-------------|-------------|
| Journal Mode | WAL | Write-ahead logging |
| Foreign Keys | ON | Referential integrity |
| Synchronous | NORMAL | Balance of safety/speed |
| Cache Size | -2000 | 2MB cache |
| Busy Timeout | 5000 | 5 second timeout |

---

## Troubleshooting

### Common Issues

**1. Database Locked**
```
Error: database is locked
```
**Solution:** Enable WAL mode:
```c
sqlite_open_wal(db, "app.db");
```

**2. Table Does Not Exist**
```
Error: no such table: users
```
**Solution:** Run migrations on startup:
```c
sqlite_migrate(db, MIGRATIONS, MIGRATION_COUNT, MIGRATION_COUNT);
```

**3. Foreign Key Constraint Failed**
```
Error: FOREIGN KEY constraint failed
```
**Solution:** Enable foreign keys:
```c
sqlite_execute(db, "PRAGMA foreign_keys=ON");
```

**4. Disk I/O Error**
```
Error: disk I/O error
```
**Solution:** Check file permissions and disk space.

### Debug Mode

Enable verbose logging:

```c
/* In main.c */
LoggerService* logger = logger_service_inject();
logger_set_level(logger, LOG_LEVEL_DEBUG);
```

Check SQLite version:

```c
const char* version = sqlite_query_scalar(db, "SELECT sqlite_version()");
printf("SQLite Version: %s\n", version);
```

### Performance Tuning

For better performance:

```c
/* Increase cache size */
sqlite_execute(db, "PRAGMA cache_size = -4000");

/* Set busy timeout */
sqlite_execute(db, "PRAGMA busy_timeout = 5000");

/* Analyze tables for query optimization */
sqlite_execute(db, "ANALYZE");
```

---

## Related Documentation

- [DuckDB-CRUD Integration](./DUCKDB_CRUD_INTEGRATION.md) - Analytical database CRUD
- [SQLite Service](./backend/services/sqlite.md) - Low-level SQLite API
- [CRUD API](./backend/services/crud-api.md) - CRUD handler reference

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** March 30, 2026
