/* SQLite Service Tests */

#include "tests/test_utils.h"
#include "services/sqlite_service.h"
#include "migrations.h"

TEST_SUITE_INIT(sqlite_suite);

TEST(test_sqlite_injection) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    ASSERT_NOT_NULL(sqlite);
    ASSERT_STR_EQ(sqlite->base.name, "sqlite_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_open_memory) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    
    int result = sqlite_open(sqlite, ":memory:");
    ASSERT_TRUE(result);
    ASSERT_TRUE(sqlite_is_open(sqlite));
    
    sqlite_close(sqlite);
    ASSERT_FALSE(sqlite_is_open(sqlite));
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_execute_basic) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    int result = sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, name TEXT)");
    ASSERT_TRUE(result);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_insert_select) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE users (id INTEGER, name TEXT, email TEXT)");
    sqlite_execute(sqlite, "INSERT INTO users VALUES (1, 'Alice', 'alice@test.com')");
    sqlite_execute(sqlite, "INSERT INTO users VALUES (2, 'Bob', 'bob@test.com')");
    
    SQLiteResult result = sqlite_query(sqlite, "SELECT * FROM users ORDER BY id");
    ASSERT_TRUE(result.success);
    ASSERT_EQ(result.row_count, 2);
    ASSERT_EQ(result.column_count, 3);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_update_delete) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, value TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1, 'initial')");
    
    sqlite_execute(sqlite, "UPDATE test SET value = 'updated' WHERE id = 1");
    SQLiteResult result = sqlite_query(sqlite, "SELECT value FROM test WHERE id = 1");
    ASSERT_EQ(result.row_count, 1);
    ASSERT_STR_EQ(result.rows[0].values[0], "updated");
    sqlite_free_result(&result);
    
    sqlite_execute(sqlite, "DELETE FROM test WHERE id = 1");
    result = sqlite_query(sqlite, "SELECT * FROM test");
    ASSERT_EQ(result.row_count, 0);
    sqlite_free_result(&result);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_query_params) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, name TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')");
    
    const char* params[] = {"2"};
    SQLiteResult result = sqlite_query_params(sqlite, "SELECT name FROM test WHERE id = ?", params, 1);
    ASSERT_TRUE(result.success);
    ASSERT_EQ(result.row_count, 1);
    ASSERT_STR_EQ(result.rows[0].values[0], "Bob");
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_query_one) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (value TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES ('single')");
    
    SQLiteResult result = sqlite_query_one(sqlite, "SELECT value FROM test");
    ASSERT_EQ(result.row_count, 1);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_query_scalar) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE config (key TEXT, value TEXT)");
    sqlite_execute(sqlite, "INSERT INTO config VALUES ('version', '1.0.0')");
    
    const char* value = sqlite_query_scalar(sqlite, "SELECT value FROM config WHERE key = 'version'");
    ASSERT_NOT_NULL(value);
    ASSERT_STR_EQ(value, "1.0.0");
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_last_insert_rowid) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test (name) VALUES ('first')");
    
    long long id = sqlite_last_insert_rowid(sqlite);
    ASSERT_EQ(id, 1);
    
    sqlite_execute(sqlite, "INSERT INTO test (name) VALUES ('second')");
    id = sqlite_last_insert_rowid(sqlite);
    ASSERT_EQ(id, 2);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_changes) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1), (2), (3)");
    
    int changes = sqlite_changes(sqlite);
    ASSERT_EQ(changes, 3);
    
    sqlite_execute(sqlite, "DELETE FROM test WHERE id = 1");
    changes = sqlite_changes(sqlite);
    ASSERT_EQ(changes, 1);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_migrations) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    int result = sqlite_migrate(sqlite, migrations, migrations_count, -1);
    ASSERT_TRUE(result);
    
    int version = sqlite_get_version(sqlite);
    ASSERT_EQ(version, migrations_count);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_integrity_check) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER)");
    
    SQLiteResult result = sqlite_integrity_check(sqlite);
    ASSERT_TRUE(result.success);
    ASSERT_GT(result.row_count, 0);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_vacuum) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER)");
    
    int result = sqlite_vacuum(sqlite);
    ASSERT_TRUE(result);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}
