/* CRUD API Implementation - Backend API handlers for frontend communication */

#include "crud_api.h"
#include "webui_service.h"
#include "sqlite_service.h"
#include "logger_service.h"
#include <webui.h>
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
    
    const char* n = strstr(json_str, "\"name\"");
    if (n) {
        const char* q1 = strchr(n, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && q2 - q1 - 1 < (int)sizeof(name)) {
            strncpy(name, q1 + 1, q2 - q1 - 1);
        }
    }
    
    const char* e2 = strstr(json_str, "\"email\"");
    if (e2) {
        const char* q1 = strchr(e2, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && q2 - q1 - 1 < (int)sizeof(email)) {
            strncpy(email, q1 + 1, q2 - q1 - 1);
        }
    }
    
    const char* a = strstr(json_str, "\"age\"");
    if (a) sscanf(a + 5, "%d", &age);
    
    if (!name[0] || !email[0]) {
        send_response(e, build_json_response(0, NULL, "Missing fields"));
        return;
    }
    
    char sql[1024];
    snprintf(sql, sizeof(sql), 
        "INSERT INTO users (name, email, age) VALUES ('%s', '%s', %d)",
        name, email, age);
    
    if (!sqlite_execute(g_sqlite, sql)) {
        if (logger) logger_log(logger, "ERROR", "create_user failed");
        send_response(e, build_json_response(0, NULL, "Insert failed"));
        return;
    }
    
    long long id = sqlite_last_insert_rowid(g_sqlite);
    if (logger) logger_log(logger, "INFO", "Created user id=%lld", id);
    
    char resp[1024];
    snprintf(resp, sizeof(resp), 
        "{\"id\":%lld,\"name\":\"%s\",\"email\":\"%s\",\"age\":%d}", id, name, email, age);
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
    
    const char* i = strstr(json_str, "\"id\"");
    if (i) sscanf(i + 4, "%d", &id);
    
    const char* n = strstr(json_str, "\"name\"");
    if (n) {
        const char* q1 = strchr(n, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && q2 - q1 - 1 < (int)sizeof(name)) {
            strncpy(name, q1 + 1, q2 - q1 - 1);
        }
    }
    
    const char* e2 = strstr(json_str, "\"email\"");
    if (e2) {
        const char* q1 = strchr(e2, '"');
        const char* q2 = q1 ? strchr(q1 + 1, '"') : NULL;
        if (q1 && q2 && q2 - q1 - 1 < (int)sizeof(email)) {
            strncpy(email, q1 + 1, q2 - q1 - 1);
        }
    }
    
    const char* a = strstr(json_str, "\"age\"");
    if (a) sscanf(a + 5, "%d", &age);
    
    if (!id || (!name[0] && !email[0])) {
        send_response(e, build_json_response(0, NULL, "Missing fields"));
        return;
    }
    
    char sql[2048];
    snprintf(sql, sizeof(sql), 
        "UPDATE users SET name='%s', email='%s', age=%d, updated_at=CURRENT_TIMESTAMP WHERE id=%d",
        name, email, age, id);
    
    if (!sqlite_execute(g_sqlite, sql)) {
        send_response(e, build_json_response(0, NULL, "Update failed"));
        return;
    }
    
    if (logger) logger_log(logger, "INFO", "Updated user id=%d", id);
    char resp[1024];
    snprintf(resp, sizeof(resp), "{\"id\":%d,\"name\":\"%s\",\"email\":\"%s\",\"age\":%d}", id, name, email, age);
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
    
    char sql[256];
    snprintf(sql, sizeof(sql), "DELETE FROM users WHERE id=%d", id);
    
    if (!sqlite_execute(g_sqlite, sql)) {
        send_response(e, build_json_response(0, NULL, "Delete failed"));
        return;
    }
    
    if (logger) logger_log(logger, "INFO", "Deleted user id=%d", id);
    send_response(e, build_json_response(1, "{\"message\":\"deleted\"}", NULL));
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

int crud_api_init(WebuiService* webui, SQLiteService* sqlite) {
    if (!webui || !sqlite) {
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    g_sqlite = sqlite;
    g_window = webui->window;
    
    webui_bind(webui->window, "getUsers", handle_get_users);
    webui_bind(webui->window, "createUser", handle_create_user);
    webui_bind(webui->window, "updateUser", handle_update_user);
    webui_bind(webui->window, "deleteUser", handle_delete_user);
    webui_bind(webui->window, "getUserStats", handle_get_user_stats);
    webui_bind(webui->window, "getProducts", handle_get_products);
    webui_bind(webui->window, "getCategories", handle_get_categories);
    webui_bind(webui->window, "getOrders", handle_get_orders);
    
    if (logger) {
        logger_log(logger, "INFO", "CRUD API initialized with %d handlers", 8);
    }
    
    return 1;
}
