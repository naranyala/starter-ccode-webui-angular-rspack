/* Database Migrations - Schema definitions */

#ifndef MIGRATIONS_H
#define MIGRATIONS_H

#include "services/sqlite_service.h"

/* Forward declaration for sqlite3 */
typedef struct sqlite3 sqlite3;
typedef struct sqlite3_stmt sqlite3_stmt;

/* SQLite result codes */
#define SQLITE_OK 0
#define SQLITE_ROW 100
#define SQLITE_DONE 101

/* SQLite exec function - declared externally */
extern int sqlite3_exec(sqlite3* db, const char* sql, void* callback, void* arg, char** errmsg);

/* Migration 001: Create users table */
static int migration_001_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS users ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  username TEXT UNIQUE NOT NULL,"
        "  email TEXT UNIQUE NOT NULL,"
        "  password_hash TEXT NOT NULL,"
        "  role INTEGER DEFAULT 0,"
        "  is_active INTEGER DEFAULT 1,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    
    return sqlite3_exec(db, sql, NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

static int migration_001_down(sqlite3* db, void* user_data) {
    (void)user_data;
    return sqlite3_exec(db, "DROP TABLE IF EXISTS users", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* Migration 002: Create sessions table for token management */
static int migration_002_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS sessions ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  user_id INTEGER NOT NULL,"
        "  refresh_token_hash TEXT,"
        "  device_info TEXT,"
        "  ip_address TEXT,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  expires_at TIMESTAMP,"
        "  revoked INTEGER DEFAULT 0,"
        "  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
        ")";
    
    return sqlite3_exec(db, sql, NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

static int migration_002_down(sqlite3* db, void* user_data) {
    (void)user_data;
    return sqlite3_exec(db, "DROP TABLE IF EXISTS sessions", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* Migration 003: Create audit log table */
static int migration_003_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS audit_log ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  user_id INTEGER,"
        "  action TEXT NOT NULL,"
        "  resource TEXT,"
        "  details TEXT,"
        "  ip_address TEXT,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL"
        ")";
    
    return sqlite3_exec(db, sql, NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

static int migration_003_down(sqlite3* db, void* user_data) {
    (void)user_data;
    return sqlite3_exec(db, "DROP TABLE IF EXISTS audit_log", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* Migration 004: Create application settings table */
static int migration_004_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* create_sql = 
        "CREATE TABLE IF NOT EXISTS settings ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  key TEXT UNIQUE NOT NULL,"
        "  value TEXT,"
        "  type TEXT DEFAULT 'string',"
        "  description TEXT,"
        "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    
    if (sqlite3_exec(db, create_sql, NULL, NULL, NULL) != SQLITE_OK) {
        return 0;
    }
    
    /* Insert default settings */
    const char* defaults[] = {
        "INSERT OR IGNORE INTO settings (key, value, type, description) VALUES ('app.name', 'C Angular WebUI App', 'string', 'Application name')",
        "INSERT OR IGNORE INTO settings (key, value, type, description) VALUES ('app.version', '1.0.0', 'string', 'Application version')",
        "INSERT OR IGNORE INTO settings (key, value, type, description) VALUES ('auth.token_expiry', '3600', 'integer', 'Access token expiry in seconds')",
        "INSERT OR IGNORE INTO settings (key, value, type, description) VALUES ('auth.refresh_expiry', '604800', 'integer', 'Refresh token expiry in seconds')",
        NULL
    };
    
    for (int i = 0; defaults[i]; i++) {
        if (sqlite3_exec(db, defaults[i], NULL, NULL, NULL) != SQLITE_OK) {
            return 0;
        }
    }
    
    return 1;
}

static int migration_004_down(sqlite3* db, void* user_data) {
    (void)user_data;
    return sqlite3_exec(db, "DROP TABLE IF EXISTS settings", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* All migrations array */
static const SQLiteMigration migrations[] = {
    {0, "create_users_table", migration_001_up, migration_001_down},
    {1, "create_sessions_table", migration_002_up, migration_002_down},
    {2, "create_audit_log_table", migration_003_up, migration_003_down},
    {3, "create_settings_table", migration_004_up, migration_004_down},
};

static const int migrations_count = sizeof(migrations) / sizeof(migrations[0]);

#endif /* MIGRATIONS_H */
