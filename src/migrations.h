/* Database Migrations - Schema definitions for CRUD Demo */

#ifndef MIGRATIONS_H
#define MIGRATIONS_H

#include "services/sqlite_service.h"

/* Forward declaration for sqlite3 */
typedef struct sqlite3 sqlite3;

/* SQLite result codes */
#define SQLITE_OK 0
#define SQLITE_ROW 100
#define SQLITE_DONE 101

/* SQLite exec function */
extern int sqlite3_exec(sqlite3* db, const char* sql, void* callback, void* arg, char** errmsg);

/* ==================== MIGRATION 001: Categories ==================== */
static int migration_001_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS categories ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  name TEXT NOT NULL UNIQUE,"
        "  description TEXT,"
        "  color TEXT DEFAULT '#6366f1',"
        "  icon TEXT DEFAULT 'folder',"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    
    return sqlite3_exec(db, sql, NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

static int migration_001_down(sqlite3* db, void* user_data) {
    (void)user_data;
    return sqlite3_exec(db, "DROP TABLE IF EXISTS categories", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* ==================== MIGRATION 002: Users ==================== */
static int migration_002_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS users ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  name TEXT NOT NULL,"
        "  email TEXT NOT NULL UNIQUE,"
        "  age INTEGER CHECK (age >= 0 AND age <= 150),"
        "  avatar TEXT,"
        "  is_active INTEGER DEFAULT 1,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    
    return sqlite3_exec(db, sql, NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

static int migration_002_down(sqlite3* db, void* user_data) {
    (void)user_data;
    return sqlite3_exec(db, "DROP TABLE IF EXISTS users", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* ==================== MIGRATION 003: Products ==================== */
static int migration_003_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS products ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  name TEXT NOT NULL,"
        "  description TEXT,"
        "  price REAL NOT NULL CHECK (price >= 0),"
        "  stock INTEGER DEFAULT 0 CHECK (stock >= 0),"
        "  category_id INTEGER,"
        "  sku TEXT UNIQUE,"
        "  image_url TEXT,"
        "  is_active INTEGER DEFAULT 1,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL"
        ")";
    
    if (sqlite3_exec(db, sql, NULL, NULL, NULL) != SQLITE_OK) {
        return 0;
    }
    
    /* Create indexes for better query performance */
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)", NULL, NULL, NULL);
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)", NULL, NULL, NULL);
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)", NULL, NULL, NULL);
    
    return 1;
}

static int migration_003_down(sqlite3* db, void* user_data) {
    (void)user_data;
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_products_category", NULL, NULL, NULL);
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_products_sku", NULL, NULL, NULL);
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_products_price", NULL, NULL, NULL);
    return sqlite3_exec(db, "DROP TABLE IF EXISTS products", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* ==================== MIGRATION 004: Orders ==================== */
static int migration_004_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS orders ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  user_id INTEGER NOT NULL,"
        "  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),"
        "  total_amount REAL DEFAULT 0 CHECK (total_amount >= 0),"
        "  shipping_address TEXT,"
        "  notes TEXT,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
        ")";
    
    if (sqlite3_exec(db, sql, NULL, NULL, NULL) != SQLITE_OK) {
        return 0;
    }
    
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)", NULL, NULL, NULL);
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)", NULL, NULL, NULL);
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)", NULL, NULL, NULL);
    
    return 1;
}

static int migration_004_down(sqlite3* db, void* user_data) {
    (void)user_data;
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_orders_user", NULL, NULL, NULL);
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_orders_status", NULL, NULL, NULL);
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_orders_created", NULL, NULL, NULL);
    return sqlite3_exec(db, "DROP TABLE IF EXISTS orders", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* ==================== MIGRATION 005: Order Items ==================== */
static int migration_005_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS order_items ("
        "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "  order_id INTEGER NOT NULL,"
        "  product_id INTEGER NOT NULL,"
        "  quantity INTEGER NOT NULL CHECK (quantity > 0),"
        "  unit_price REAL NOT NULL CHECK (unit_price >= 0),"
        "  subtotal REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
        "  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,"
        "  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE"
        ")";
    
    if (sqlite3_exec(db, sql, NULL, NULL, NULL) != SQLITE_OK) {
        return 0;
    }
    
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)", NULL, NULL, NULL);
    sqlite3_exec(db, "CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)", NULL, NULL, NULL);
    
    return 1;
}

static int migration_005_down(sqlite3* db, void* user_data) {
    (void)user_data;
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_order_items_order", NULL, NULL, NULL);
    sqlite3_exec(db, "DROP INDEX IF EXISTS idx_order_items_product", NULL, NULL, NULL);
    return sqlite3_exec(db, "DROP TABLE IF EXISTS order_items", NULL, NULL, NULL) == SQLITE_OK ? 1 : 0;
}

/* ==================== MIGRATION 006: Seed Data ==================== */
static int migration_006_up(sqlite3* db, void* user_data) {
    (void)user_data;
    
    /* Insert categories */
    const char* categories[] = {
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Electronics', 'Electronic devices and accessories', '#3b82f6', 'cpu')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Clothing', 'Apparel and fashion items', '#10b981', 'shirt')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Books', 'Books and publications', '#f59e0b', 'book-open')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Home & Garden', 'Home improvement and garden', '#8b5cf6', 'home')",
        "INSERT OR IGNORE INTO categories (name, description, color, icon) VALUES ('Sports', 'Sports and outdoor equipment', '#ef4444', 'dumbbell')",
        NULL
    };
    
    for (int i = 0; categories[i]; i++) {
        if (sqlite3_exec(db, categories[i], NULL, NULL, NULL) != SQLITE_OK) {
            return 0;
        }
    }
    
    /* Insert users */
    const char* users[] = {
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Alice Johnson', 'alice@example.com', 28)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Bob Smith', 'bob@company.org', 35)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Charlie Brown', 'charlie@test.net', 42)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Diana Prince', 'diana@hero.com', 30)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Eve Adams', 'eve@secure.gov', 25)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Frank Miller', 'frank@tech.io', 38)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Grace Lee', 'grace@design.co', 29)",
        "INSERT OR IGNORE INTO users (name, email, age) VALUES ('Henry Wilson', 'henry@data.net', 45)",
        NULL
    };
    
    for (int i = 0; users[i]; i++) {
        if (sqlite3_exec(db, users[i], NULL, NULL, NULL) != SQLITE_OK) {
            return 0;
        }
    }
    
    /* Insert products */
    const char* products[] = {
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Laptop Pro 15', 'High-performance laptop with 16GB RAM', 1299.99, 25, 1, 'ELEC-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 150, 1, 'ELEC-002')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('USB-C Hub', '7-in-1 USB-C hub adapter', 49.99, 80, 1, 'ELEC-003')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, 200, 2, 'CLTH-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Denim Jeans', 'Classic fit denim jeans', 59.99, 120, 2, 'CLTH-002')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Running Shoes', 'Lightweight running shoes', 89.99, 75, 5, 'SPRT-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Yoga Mat', 'Non-slip yoga mat', 24.99, 100, 5, 'SPRT-002')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Programming Guide', 'Complete programming handbook', 44.99, 50, 3, 'BOOK-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Garden Tools Set', 'Essential garden tools kit', 69.99, 40, 4, 'HOME-001')",
        "INSERT OR IGNORE INTO products (name, description, price, stock, category_id, sku) VALUES ('Smart Watch', 'Fitness tracking smart watch', 199.99, 60, 1, 'ELEC-004')",
        NULL
    };
    
    for (int i = 0; products[i]; i++) {
        if (sqlite3_exec(db, products[i], NULL, NULL, NULL) != SQLITE_OK) {
            return 0;
        }
    }
    
    /* Insert orders with items */
    const char* orders[] = {
        "INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'delivered', 289.97)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (2, 'processing', 1299.99)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (3, 'shipped', 154.97)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'pending', 79.98)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (4, 'delivered', 224.98)",
        "INSERT INTO orders (user_id, status, total_amount) VALUES (5, 'cancelled', 49.99)",
        NULL
    };
    
    for (int i = 0; orders[i]; i++) {
        if (sqlite3_exec(db, orders[i], NULL, NULL, NULL) != SQLITE_OK) {
            return 0;
        }
    }
    
    /* Insert order items */
    const char* order_items[] = {
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 2, 2, 29.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 3, 1, 49.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 6, 1, 89.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (1, 7, 2, 24.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (2, 1, 1, 1299.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 2, 1, 29.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 4, 3, 19.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (3, 5, 1, 59.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (4, 6, 1, 89.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (5, 8, 1, 44.99)",
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (5, 10, 1, 199.99)",
        NULL
    };
    
    for (int i = 0; order_items[i]; i++) {
        if (sqlite3_exec(db, order_items[i], NULL, NULL, NULL) != SQLITE_OK) {
            return 0;
        }
    }
    
    return 1;
}

static int migration_006_down(sqlite3* db, void* user_data) {
    (void)user_data;
    sqlite3_exec(db, "DELETE FROM order_items", NULL, NULL, NULL);
    sqlite3_exec(db, "DELETE FROM orders", NULL, NULL, NULL);
    sqlite3_exec(db, "DELETE FROM products", NULL, NULL, NULL);
    sqlite3_exec(db, "DELETE FROM users", NULL, NULL, NULL);
    sqlite3_exec(db, "DELETE FROM categories", NULL, NULL, NULL);
    return 1;
}

/* ==================== All Migrations ==================== */
static const SQLiteMigration migrations[] = {
    {0, "create_categories_table", migration_001_up, migration_001_down},
    {1, "create_users_table", migration_002_up, migration_002_down},
    {2, "create_products_table", migration_003_up, migration_003_down},
    {3, "create_orders_table", migration_004_up, migration_004_down},
    {4, "create_order_items_table", migration_005_up, migration_005_down},
    {5, "seed_demo_data", migration_006_up, migration_006_down},
};

static const int migrations_count = sizeof(migrations) / sizeof(migrations[0]);

#endif /* MIGRATIONS_H */
