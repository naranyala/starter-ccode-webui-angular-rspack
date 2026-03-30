/* CRUD API Implementation - Backend API handlers for frontend communication */

#include "crud_api.h"
#include "webui_service.h"
#include "sqlite_service.h"
#include "logger_service.h"
#include "data_validation.h"
#include <webui.h>
#include <sqlite3.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static SQLiteService* g_sqlite = NULL;
static size_t g_window = 0;

static void send_response(webui_event_t* e, const char* json_response) {
    webui_interface_set_response(e->window, e->event_number, json_response);
}

static char* build_json_response(int success, const char* data, const char* error) {
    static char buffer[65536];
    if (success) {
        snprintf(buffer, sizeof(buffer), 
            "{\"success\":true,\"data\":%s}", data ? data : "null");
    } else {
        snprintf(buffer, sizeof(buffer), 
            "{\"success\":false,\"error\":\"%s\"}", error ? error : "Unknown error");
    }
    return buffer;
}

static char* escape_json(const char* str) {
    static char buffer[8192];
    if (!str) return "";
    
    int j = 0;
    for (int i = 0; str[i] && j < (int)(sizeof(buffer) - 2); i++) {
        switch (str[i]) {
            case '"': buffer[j++] = '\\'; buffer[j++] = '"'; break;
            case '\\': buffer[j++] = '\\'; buffer[j++] = '\\'; break;
            case '\n': buffer[j++] = '\\'; buffer[j++] = 'n'; break;
            case '\r': buffer[j++] = '\\'; buffer[j++] = 'r'; break;
            case '\t': buffer[j++] = '\\'; buffer[j++] = 't'; break;
            default: buffer[j++] = str[i]; break;
        }
    }
    buffer[j] = '\0';
    return buffer;
}

static char* get_val(SQLiteResult* r, int row, int col) {
    if (row >= 0 && row < r->row_count && col >= 0 && col < r->column_count) {
        return r->rows[row].values[col];
    }
    return "";
}

static void handle_get_users(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    SQLiteResult result = sqlite_query(g_sqlite, 
        "SELECT id, name, email, age, created_at FROM users ORDER BY id");
    
    if (!result.success) {
        if (logger) logger_log(logger, "ERROR", "get_users failed");
        send_response(e, build_json_response(0, NULL, "Query failed"));
        return;
    }
    
    char json[65536] = "[";
    int first = 1;
    for (int i = 0; i < result.row_count; i++) {
        char row[512];
        snprintf(row, sizeof(row), 
            "%s{\"id\":%s,\"name\":\"%s\",\"email\":\"%s\",\"age\":%s,\"created_at\":\"%s\"}",
            first ? "" : ",",
            get_val(&result, i, 0),
            escape_json(get_val(&result, i, 1)),
            escape_json(get_val(&result, i, 2)),
            get_val(&result, i, 3),
            escape_json(get_val(&result, i, 4))
        );
        strcat(json, row);
        first = 0;
    }
    strcat(json, "]");
    
    sqlite_free_result(&result);
    send_response(e, build_json_response(1, json, NULL));
}

/**
 * @brief Escape a string for SQL by doubling single quotes
 * @param dest Destination buffer
 * @param dest_size Size of destination buffer
 * @param src Source string to escape
 */
static void escape_sql_string(char* dest, size_t dest_size, const char* src) {
    if (!dest || !src) return;
    
    size_t j = 0;
    for (size_t i = 0; src[i] && j < dest_size - 1; i++) {
        if (src[i] == '\'') {
            if (j + 2 < dest_size) {
                dest[j++] = '\'';
                dest[j++] = '\'';
            }
        } else {
            dest[j++] = src[i];
        }
    }
    dest[j] = '\0';
}

/**
 * @brief Validate integer input
 * @param str String to validate
 * @param out Output integer value
 * @return true if valid integer, false otherwise
 */
static bool validate_int(const char* str, int* out) {
    if (!str || !out) return false;
    
    char* endptr;
    long val = strtol(str, &endptr, 10);
    
    if (*endptr != '\0' || val < INT_MIN || val > INT_MAX) {
        return false;
    }
    
    *out = (int)val;
    return true;
}

static void handle_create_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();

    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }

    const char* json_str = webui_get_string(e);
    if (!json_str) {
        send_response(e, build_json_response(0, NULL, "Invalid request"));
        return;
    }

    char name[256] = {0}, email[256] = {0};
    int age = 25;

    /* Parse name with bounds checking */
    const char* n = strstr(json_str, "\"name\"");
    if (n) {
        const char* q1 = strchr(n, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && (size_t)(q2 - q1 - 1) < sizeof(name)) {
            strncpy(name, q1 + 1, q2 - q1 - 1);
            name[q2 - q1 - 1] = '\0';
        }
    }

    /* Parse email with bounds checking */
    const char* e2 = strstr(json_str, "\"email\"");
    if (e2) {
        const char* q1 = strchr(e2, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && (size_t)(q2 - q1 - 1) < sizeof(email)) {
            strncpy(email, q1 + 1, q2 - q1 - 1);
            email[q2 - q1 - 1] = '\0';
        }
    }

    /* Parse age with validation */
    const char* a = strstr(json_str, "\"age\"");
    if (a) {
        int parsed_age;
        if (validate_int(a + 5, &parsed_age) && parsed_age > 0 && parsed_age <= 150) {
            age = parsed_age;
        }
    }

    if (!name[0] || !email[0]) {
        send_response(e, build_json_response(0, NULL, "Missing fields"));
        return;
    }

    /* Use prepared statement to prevent SQL injection */
    sqlite3_stmt* stmt = sqlite_prepare(g_sqlite,
        "INSERT INTO users (name, email, age) VALUES (?, ?, ?)");
    
    if (!stmt) {
        if (logger) logger_log(logger, "ERROR", "Failed to prepare statement");
        send_response(e, build_json_response(0, NULL, "Database error"));
        return;
    }

    sqlite_bind_text(stmt, 1, name);
    sqlite_bind_text(stmt, 2, email);
    sqlite_bind_int(stmt, 3, age);

    if (sqlite_step_execute( stmt) != SQLITE_DONE) {
        sqlite_finalize(stmt);
        if (logger) logger_log(logger, "ERROR", "create_user failed");
        send_response(e, build_json_response(0, NULL, "Insert failed"));
        return;
    }

    long long id = sqlite_last_insert_rowid(g_sqlite);
    sqlite_finalize(stmt);
    
    if (logger) logger_log(logger, "INFO", "Created user id=%lld", id);

    /* Escape output for JSON */
    char escaped_name[512], escaped_email[512];
    escape_sql_string(escaped_name, sizeof(escaped_name), name);
    escape_sql_string(escaped_email, sizeof(escaped_email), email);

    char resp[4096];
    snprintf(resp, sizeof(resp),
        "{\"id\":%lld,\"name\":\"%s\",\"email\":\"%s\",\"age\":%d}", 
        id, escaped_name, escaped_email, age);
    send_response(e, build_json_response(1, resp, NULL));
}

static void handle_update_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();

    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }

    const char* json_str = webui_get_string(e);
    if (!json_str) {
        send_response(e, build_json_response(0, NULL, "Invalid request"));
        return;
    }

    char name[256] = {0}, email[256] = {0};
    int id = 0, age = 25;

    /* Parse ID with validation */
    const char* i = strstr(json_str, "\"id\"");
    if (i) {
        int parsed_id;
        if (validate_int(i + 4, &parsed_id) && parsed_id > 0) {
            id = parsed_id;
        }
    }

    /* Parse name with bounds checking */
    const char* n = strstr(json_str, "\"name\"");
    if (n) {
        const char* q1 = strchr(n, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && (size_t)(q2 - q1 - 1) < sizeof(name)) {
            strncpy(name, q1 + 1, q2 - q1 - 1);
            name[q2 - q1 - 1] = '\0';
        }
    }

    /* Parse email with bounds checking */
    const char* e2 = strstr(json_str, "\"email\"");
    if (e2) {
        const char* q1 = strchr(e2, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && (size_t)(q2 - q1 - 1) < sizeof(email)) {
            strncpy(email, q1 + 1, q2 - q1 - 1);
            email[q2 - q1 - 1] = '\0';
        }
    }

    /* Parse age with validation */
    const char* a = strstr(json_str, "\"age\"");
    if (a) {
        int parsed_age;
        if (validate_int(a + 5, &parsed_age) && parsed_age > 0 && parsed_age <= 150) {
            age = parsed_age;
        }
    }

    if (!id) {
        send_response(e, build_json_response(0, NULL, "Missing ID"));
        return;
    }

    /* Use prepared statement to prevent SQL injection */
    sqlite3_stmt* stmt = sqlite_prepare(g_sqlite,
        "UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    
    if (!stmt) {
        if (logger) logger_log(logger, "ERROR", "Failed to prepare update statement");
        send_response(e, build_json_response(0, NULL, "Database error"));
        return;
    }

    sqlite_bind_text(stmt, 1, name);
    sqlite_bind_text(stmt, 2, email);
    sqlite_bind_int(stmt, 3, age);
    sqlite_bind_int(stmt, 4, id);

    if (sqlite_step_execute( stmt) != SQLITE_DONE) {
        sqlite_finalize(stmt);
        if (logger) logger_log(logger, "ERROR", "update_user failed");
        send_response(e, build_json_response(0, NULL, "Update failed"));
        return;
    }

    sqlite_finalize(stmt);
    
    if (logger) logger_log(logger, "INFO", "Updated user id=%d", id);
    
    char resp[4096];
    snprintf(resp, sizeof(resp), 
        "{\"id\":%d,\"name\":\"%s\",\"email\":\"%s\",\"age\":%d}", 
        id, name, email, age);
    send_response(e, build_json_response(1, resp, NULL));
}

static void handle_delete_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();

    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }

    const char* json_str = webui_get_string(e);
    if (!json_str) {
        send_response(e, build_json_response(0, NULL, "Invalid request"));
        return;
    }

    int id = 0;
    const char* i = strstr(json_str, "\"id\"");
    if (i) sscanf(i + 4, "%d", &id);

    if (!id) {
        send_response(e, build_json_response(0, NULL, "Missing ID"));
        return;
    }

    /* Validate deletion - check for dependencies */
    DependencyInfo dep_info;
    ValidationCode validation = validate_user_delete(g_sqlite, id, &dep_info);
    
    if (validation != VALIDATION_OK) {
        if (logger) {
            logger_log(logger, "WARN", "User delete validation failed: %s", 
                      validation_code_to_string(validation));
        }
        
        if (validation == VALIDATION_NOT_FOUND) {
            send_response(e, build_json_response(0, NULL, "User not found"));
        } else if (validation == VALIDATION_HAS_DEPENDENCIES) {
            /* Return dependency info for user-friendly message */
            char error_json[512];
            snprintf(error_json, sizeof(error_json),
                "{\"has_dependencies\":true,\"table\":\"%s\",\"count\":%d,\"message\":\"%s\"}",
                dep_info.table, dep_info.count, dep_info.message);
            send_response(e, build_json_response(0, NULL, error_json));
        } else {
            send_response(e, build_json_response(0, NULL, validation_code_to_string(validation)));
        }
        return;
    }

    /* Safe to delete */
    char sql[256];
    snprintf(sql, sizeof(sql), "DELETE FROM users WHERE id=%d", id);

    if (!sqlite_execute(g_sqlite, sql)) {
        send_response(e, build_json_response(0, NULL, "Delete failed"));
        return;
    }

    if (logger) logger_log(logger, "INFO", "Deleted user id=%d", id);
    send_response(e, build_json_response(1, "{\"message\":\"deleted\"}", NULL));
}

/**
 * @brief Check if a user can be safely deleted (validation endpoint)
 */
static void handle_validate_delete_user(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();

    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }

    const char* json_str = webui_get_string(e);
    if (!json_str) {
        send_response(e, build_json_response(0, NULL, "Invalid request"));
        return;
    }

    int id = 0;
    const char* i = strstr(json_str, "\"id\"");
    if (i) sscanf(i + 4, "%d", &id);

    if (!id) {
        send_response(e, build_json_response(0, NULL, "Missing ID"));
        return;
    }

    /* Validate deletion */
    DependencyInfo dep_info = {0};
    ValidationCode validation = validate_user_delete(g_sqlite, id, &dep_info);
    
    /* Get user name for display */
    char name_sql[256];
    snprintf(name_sql, sizeof(name_sql), "SELECT name FROM users WHERE id=%d", id);
    const char* user_name = sqlite_query_scalar(g_sqlite, name_sql);
    
    /* Build response */
    char response[1024];
    
    if (validation == VALIDATION_OK) {
        snprintf(response, sizeof(response),
            "{\"success\":true,\"can_delete\":true,\"user_name\":\"%s\"}",
            user_name ? user_name : "Unknown");
    } else if (validation == VALIDATION_HAS_DEPENDENCIES) {
        snprintf(response, sizeof(response),
            "{\"success\":true,\"can_delete\":false,\"user_name\":\"%s\","
            "\"dependency_table\":\"%s\",\"dependency_count\":%d,\"message\":\"%s\"}",
            user_name ? user_name : "Unknown",
            dep_info.table, dep_info.count, dep_info.message);
    } else if (validation == VALIDATION_NOT_FOUND) {
        snprintf(response, sizeof(response),
            "{\"success\":false,\"error\":\"User not found\"}");
    } else {
        snprintf(response, sizeof(response),
            "{\"success\":false,\"error\":\"%s\"}",
            validation_code_to_string(validation));
    }
    
    if (logger) {
        logger_log(logger, "INFO", "Validate delete user %d: %s", 
                  id, validation_code_to_string(validation));
    }
    
    send_response(e, response);
}

static void handle_get_user_stats(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    const char* total_str = sqlite_query_scalar(g_sqlite, "SELECT COUNT(*) FROM users");
    int total = total_str ? atoi(total_str) : 0;
    
    const char* today_str = sqlite_query_scalar(g_sqlite, 
        "SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE('now')");
    int today = today_str ? atoi(today_str) : 0;
    
    const char* domains_str = sqlite_query_scalar(g_sqlite, 
        "SELECT COUNT(DISTINCT SUBSTR(email, INSTR(email, '@') + 1)) FROM users");
    int domains = domains_str ? atoi(domains_str) : 0;
    
    char resp[256];
    snprintf(resp, sizeof(resp), 
        "{\"total_users\":%d,\"today_count\":%d,\"unique_domains\":%d}",
        total, today, domains);
    
    if (logger) logger_log(logger, "INFO", "Stats: total=%d, today=%d, domains=%d", total, today, domains);
    send_response(e, build_json_response(1, resp, NULL));
}

static void handle_get_products(webui_event_t* e) {
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    SQLiteResult result = sqlite_query(g_sqlite, 
        "SELECT p.id, p.name, p.description, p.price, p.stock, COALESCE(p.sku,'') as sku, COALESCE(c.name,'') as category "
        "FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id");
    
    if (!result.success) {
        send_response(e, build_json_response(0, NULL, "Query failed"));
        return;
    }
    
    char json[65536] = "[";
    int first = 1;
    for (int i = 0; i < result.row_count; i++) {
        char row[1024];
        snprintf(row, sizeof(row), 
            "%s{\"id\":%s,\"name\":\"%s\",\"description\":\"%s\",\"price\":%s,\"stock\":%s,"
            "\"sku\":\"%s\",\"category\":\"%s\"}",
            first ? "" : ",",
            get_val(&result, i, 0),
            escape_json(get_val(&result, i, 1)),
            escape_json(get_val(&result, i, 2)),
            get_val(&result, i, 3),
            get_val(&result, i, 4),
            escape_json(get_val(&result, i, 5)),
            escape_json(get_val(&result, i, 6))
        );
        strcat(json, row);
        first = 0;
    }
    strcat(json, "]");
    
    sqlite_free_result(&result);
    send_response(e, build_json_response(1, json, NULL));
}

static void handle_get_categories(webui_event_t* e) {
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    SQLiteResult result = sqlite_query(g_sqlite, 
        "SELECT id, name, description, color, icon FROM categories ORDER BY id");
    
    if (!result.success) {
        send_response(e, build_json_response(0, NULL, "Query failed"));
        return;
    }
    
    char json[32768] = "[";
    int first = 1;
    for (int i = 0; i < result.row_count; i++) {
        char row[512];
        snprintf(row, sizeof(row), 
            "%s{\"id\":%s,\"name\":\"%s\",\"description\":\"%s\",\"color\":\"%s\",\"icon\":\"%s\"}",
            first ? "" : ",",
            get_val(&result, i, 0),
            escape_json(get_val(&result, i, 1)),
            escape_json(get_val(&result, i, 2)),
            escape_json(get_val(&result, i, 3)),
            escape_json(get_val(&result, i, 4))
        );
        strcat(json, row);
        first = 0;
    }
    strcat(json, "]");
    
    sqlite_free_result(&result);
    send_response(e, build_json_response(1, json, NULL));
}

static void handle_get_orders(webui_event_t* e) {
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    SQLiteResult result = sqlite_query(g_sqlite, 
        "SELECT o.id, o.user_id, COALESCE(u.name,'') as user_name, o.status, o.total_amount, o.created_at "
        "FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.id DESC");
    
    if (!result.success) {
        send_response(e, build_json_response(0, NULL, "Query failed"));
        return;
    }
    
    char json[65536] = "[";
    int first = 1;
    for (int i = 0; i < result.row_count; i++) {
        char row[512];
        snprintf(row, sizeof(row), 
            "%s{\"id\":%s,\"user_id\":%s,\"user_name\":\"%s\",\"status\":\"%s\","
            "\"total_amount\":%s,\"created_at\":\"%s\"}",
            first ? "" : ",",
            get_val(&result, i, 0),
            get_val(&result, i, 1),
            escape_json(get_val(&result, i, 2)),
            escape_json(get_val(&result, i, 3)),
            get_val(&result, i, 4),
            escape_json(get_val(&result, i, 5))
        );
        strcat(json, row);
        first = 0;
    }
    strcat(json, "]");
    
    sqlite_free_result(&result);
    send_response(e, build_json_response(1, json, NULL));
}

static void handle_load_demo_data(webui_event_t* e) {
    LoggerService* logger = logger_service_inject();
    
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    const char* demo_users[] = {
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Alice Johnson', 'alice@example.com', 28)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Bob Smith', 'bob@company.org', 35)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Charlie Brown', 'charlie@test.net', 42)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Diana Prince', 'diana@hero.com', 30)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Eve Adams', 'eve@secure.gov', 25)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Frank Miller', 'frank@tech.io', 38)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Grace Lee', 'grace@design.co', 29)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Henry Wilson', 'henry@data.net', 45)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Ivy Chen', 'ivy@startup.io', 27)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Jack Davis', 'jack@enterprise.com', 33)",
        NULL
    };
    
    const char* demo_categories[] = {
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Electronics', 'Electronic devices and accessories', '#3b82f6', 'cpu')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Clothing', 'Apparel and fashion items', '#10b981', 'shirt')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Books', 'Books and publications', '#f59e0b', 'book-open')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Home & Garden', 'Home improvement and garden', '#8b5cf6', 'home')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Sports', 'Sports and outdoor equipment', '#ef4444', 'dumbbell')",
        NULL
    };
    
    const char* demo_products[] = {
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Laptop Pro 15', 'High-performance laptop with 16GB RAM', 1299.99, 25, 1, 'ELEC-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 150, 1, 'ELEC-002')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('USB-C Hub', '7-in-1 USB-C hub adapter', 49.99, 80, 1, 'ELEC-003')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Smart Watch', 'Fitness tracking smart watch', 199.99, 60, 1, 'ELEC-004')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, 200, 2, 'CLTH-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Denim Jeans', 'Classic fit denim jeans', 59.99, 120, 2, 'CLTH-002')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Running Shoes', 'Lightweight running shoes', 89.99, 75, 5, 'SPRT-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Yoga Mat', 'Non-slip yoga mat', 24.99, 100, 5, 'SPRT-002')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Programming Guide', 'Complete programming handbook', 44.99, 50, 3, 'BOOK-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Garden Tools Set', 'Essential garden tools kit', 69.99, 40, 4, 'HOME-001')",
        NULL
    };
    
    const char* demo_orders[] = {
        "INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'delivered', 289.97)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (2, 'processing', 1299.99)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (3, 'shipped', 154.97)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'pending', 79.98)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (4, 'delivered', 224.98)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (5, 'cancelled', 49.99)",
        NULL
    };
    
    const char* demo_order_items[] = {
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 2, 2, 29.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 3, 1, 49.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 7, 1, 89.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (2, 1, 1, 1299.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 2, 1, 29.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 5, 3, 19.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (4, 7, 1, 89.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (5, 9, 1, 44.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (5, 4, 1, 199.99)",
        NULL
    };
    
    int success = 1;
    
    if (!sqlite_begin_transaction(g_sqlite)) {
        send_response(e, build_json_response(0, NULL, "Failed to begin transaction"));
        return;
    }
    
    for (int i = 0; demo_users[i] && success; i++) {
        if (!sqlite_execute(g_sqlite, demo_users[i])) {
            success = 0;
        }
    }
    
    for (int i = 0; demo_categories[i] && success; i++) {
        if (!sqlite_execute(g_sqlite, demo_categories[i])) {
            success = 0;
        }
    }
    
    for (int i = 0; demo_products[i] && success; i++) {
        if (!sqlite_execute(g_sqlite, demo_products[i])) {
            success = 0;
        }
    }
    
    for (int i = 0; demo_orders[i] && success; i++) {
        if (!sqlite_execute(g_sqlite, demo_orders[i])) {
            success = 0;
        }
    }
    
    for (int i = 0; demo_order_items[i] && success; i++) {
        if (!sqlite_execute(g_sqlite, demo_order_items[i])) {
            success = 0;
        }
    }
    
    if (success) {
        sqlite_commit(g_sqlite);
        if (logger) logger_log(logger, "INFO", "Demo data loaded successfully");
        send_response(e, build_json_response(1, "{\"message\":\"Demo data loaded\"}", NULL));
    } else {
        sqlite_rollback(g_sqlite);
        if (logger) logger_log(logger, "ERROR", "Failed to load demo data");
        send_response(e, build_json_response(0, NULL, "Failed to load demo data"));
    }
}

static void handle_get_db_info(webui_event_t* e) {
    if (!g_sqlite) {
        send_response(e, build_json_response(0, NULL, "Database not initialized"));
        return;
    }
    
    const char* db_path = sqlite_get_path(g_sqlite);
    long long db_size = sqlite_get_file_size(g_sqlite);
    long long wal_size = sqlite_get_wal_size(g_sqlite);
    
    char resp[512];
    snprintf(resp, sizeof(resp), 
        "{\"database\":\"sqlite\",\"path\":\"%s\",\"size\":%lld,\"wal_size\":%lld}",
        db_path ? db_path : "unknown", db_size, wal_size);
    
    send_response(e, build_json_response(1, resp, NULL));
}

int crud_api_init(WebuiService* webui, SQLiteService* sqlite) {
    if (!webui || !sqlite) {
        return 0;
    }

    LoggerService* logger = logger_service_inject();
    g_sqlite = sqlite;
    g_window = webui->window;

    /* CRUD handlers */
    webui_bind(webui->window, "getUsers", handle_get_users);
    webui_bind(webui->window, "createUser", handle_create_user);
    webui_bind(webui->window, "updateUser", handle_update_user);
    webui_bind(webui->window, "deleteUser", handle_delete_user);
    webui_bind(webui->window, "getUserStats", handle_get_user_stats);
    
    /* Product handlers */
    webui_bind(webui->window, "getProducts", handle_get_products);
    webui_bind(webui->window, "getCategories", handle_get_categories);
    
    /* Order handlers */
    webui_bind(webui->window, "getOrders", handle_get_orders);
    
    /* Validation handlers */
    webui_bind(webui->window, "validateDeleteUser", handle_validate_delete_user);
    
    /* Utility handlers */
    webui_bind(webui->window, "loadDemoData", handle_load_demo_data);
    webui_bind(webui->window, "getDbInfo", handle_get_db_info);

    if (logger) {
        logger_log(logger, "INFO", "CRUD API initialized with %d handlers", 13);
    }

    return 1;
}
