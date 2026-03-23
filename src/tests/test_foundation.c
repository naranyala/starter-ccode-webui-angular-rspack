/* Foundation Services Tests - Logger, Event, File, Timer, JSON, Hash */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include "di/di.h"
#include "app_module.h"
#include "tests/test_utils.h"
#include "services/logger_service.h"
#include "services/event_service.h"
#include "services/file_service.h"
#include "services/timer_service.h"
#include "services/json_service.h"
#include "services/hash_service.h"

/* ============================================================================
   LOGGER SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(logger_suite);

TEST(test_logger_injection) {
    TEST_START();
    LoggerService* logger = logger_service_inject();
    ASSERT_NOT_NULL(logger);
    ASSERT_STR_EQ(logger->base.name, "logger_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_logger_log_info) {
    TEST_START();
    LoggerService* logger = logger_service_inject();
    logger_set_debug(logger, true);
    logger_log(logger, "INFO", "Test message");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_logger_log_levels) {
    TEST_START();
    LoggerService* logger = logger_service_inject();
    logger_set_debug(logger, true);
    
    logger_log(logger, "DEBUG", "Debug message");
    logger_log(logger, "INFO", "Info message");
    logger_log(logger, "WARN", "Warning message");
    logger_log(logger, "ERROR", "Error message");
    logger_log(logger, "FATAL", "Fatal message");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_logger_set_debug) {
    TEST_START();
    LoggerService* logger = logger_service_inject();
    
    logger_set_debug(logger, true);
    ASSERT_TRUE(logger->debug_enabled);
    
    logger_set_debug(logger, false);
    ASSERT_FALSE(logger->debug_enabled);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_logger_file_output) {
    TEST_START();
    LoggerService* logger = logger_service_inject();
    
    char* log_path = test_create_temp_file(NULL);
    ASSERT_NOT_NULL(log_path);
    
    int result = logger_set_file_output(logger, log_path, 3);
    ASSERT_TRUE(result);
    
    logger_set_output_mode(logger, LOG_OUTPUT_FILE);
    logger_log(logger, "INFO", "File log test");
    logger_flush(logger);
    
    /* Verify file exists and has content */
    struct stat st;
    ASSERT_EQ(stat(log_path, &st), 0);
    ASSERT_GT(st.st_size, 0);
    
    test_remove_temp_file(log_path);
    free(log_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_logger_log_macros) {
    TEST_START();
    LoggerService* logger = logger_service_inject();
    logger_set_debug(logger, true);
    
    LOG_DEBUG(logger, "Debug via macro");
    LOG_INFO(logger, "Info via macro");
    LOG_WARN(logger, "Warn via macro");
    LOG_ERROR(logger, "Error via macro");
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   EVENT SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(event_suite);

static int g_event_received = 0;
static char g_last_event[256] = {0};
static char g_last_payload[256] = {0};

static void test_event_handler(const char* event, const char* payload, void* user_data) {
    (void)user_data;
    g_event_received = 1;
    strncpy(g_last_event, event, sizeof(g_last_event) - 1);
    strncpy(g_last_payload, payload, sizeof(g_last_payload) - 1);
}

TEST(test_event_injection) {
    TEST_START();
    EventService* events = event_service_inject();
    ASSERT_NOT_NULL(events);
    ASSERT_STR_EQ(events->base.name, "event_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_event_subscribe_emit) {
    TEST_START();
    EventService* events = event_service_inject();
    
    g_event_received = 0;
    g_last_event[0] = '\0';
    g_last_payload[0] = '\0';
    
    event_subscribe(events, "test.event", test_event_handler, NULL);
    event_emit(events, "test.event", "test payload");
    
    ASSERT_TRUE(g_event_received);
    ASSERT_STR_EQ(g_last_event, "test.event");
    ASSERT_STR_EQ(g_last_payload, "test payload");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_event_multiple_subscribers) {
    TEST_START();
    EventService* events = event_service_inject();
    
    g_event_received = 0;
    
    event_subscribe(events, "multi.sub", test_event_handler, NULL);
    event_subscribe(events, "multi.sub", test_event_handler, NULL);
    event_subscribe(events, "multi.sub", test_event_handler, NULL);
    
    int count = event_get_listener_count(events, "multi.sub");
    ASSERT_EQ(count, 3);
    
    event_emit(events, "multi.sub", "test");
    ASSERT_TRUE(g_event_received);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_event_unsubscribe) {
    TEST_START();
    EventService* events = event_service_inject();
    
    event_subscribe(events, "unsubscribe.test", test_event_handler, NULL);
    ASSERT_EQ(event_get_listener_count(events, "unsubscribe.test"), 1);
    
    event_unsubscribe(events, "unsubscribe.test", test_event_handler);
    ASSERT_EQ(event_get_listener_count(events, "unsubscribe.test"), 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_event_nonexistent_listener_count) {
    TEST_START();
    EventService* events = event_service_inject();
    
    int count = event_get_listener_count(events, "nonexistent.event");
    ASSERT_EQ(count, 0);
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   FILE SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(file_suite);

TEST(test_file_injection) {
    TEST_START();
    FileService* files = file_service_inject();
    ASSERT_NOT_NULL(files);
    ASSERT_STR_EQ(files->base.name, "file_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_get_working_dir) {
    TEST_START();
    FileService* files = file_service_inject();
    
    const char* cwd = file_get_working_dir(files);
    ASSERT_NOT_NULL(cwd);
    ASSERT_GT(strlen(cwd), 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_read_write_text) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* test_path = test_create_temp_file("Hello, World!");
    ASSERT_NOT_NULL(test_path);
    
    /* Read */
    char* content = file_read_text(files, test_path);
    ASSERT_NOT_NULL(content);
    ASSERT_STR_EQ(content, "Hello, World!");
    free(content);
    
    /* Write */
    int result = file_write_text(files, test_path, "New content");
    ASSERT_EQ(result, 1);
    
    content = file_read_text(files, test_path);
    ASSERT_NOT_NULL(content);
    ASSERT_STR_EQ(content, "New content");
    free(content);
    
    test_remove_temp_file(test_path);
    free(test_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_exists) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* existing_path = test_create_temp_file("test");
    ASSERT_NOT_NULL(existing_path);
    
    ASSERT_TRUE(file_exists(files, existing_path));
    ASSERT_FALSE(file_exists(files, "/nonexistent/path/file.txt"));
    
    test_remove_temp_file(existing_path);
    free(existing_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_delete) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* test_path = test_create_temp_file("to delete");
    ASSERT_NOT_NULL(test_path);
    ASSERT_TRUE(file_exists(files, test_path));
    
    int result = file_delete(files, test_path);
    ASSERT_EQ(result, 1);
    ASSERT_FALSE(file_exists(files, test_path));
    
    free(test_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_copy) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* src_path = test_create_temp_file("copy me");
    char* dst_path = strdup("/tmp/test_copy_dest_XXXXXX");
    mkstemp(dst_path);
    unlink(dst_path);  /* Remove so copy can create it */
    
    ASSERT_NOT_NULL(src_path);
    ASSERT_NOT_NULL(dst_path);
    
    int result = file_copy(files, src_path, dst_path);
    ASSERT_EQ(result, 1);
    ASSERT_TRUE(file_exists(files, dst_path));
    
    char* content = file_read_text(files, dst_path);
    ASSERT_NOT_NULL(content);
    ASSERT_STR_EQ(content, "copy me");
    free(content);
    
    test_remove_temp_file(src_path);
    test_remove_temp_file(dst_path);
    free(src_path);
    free(dst_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_get_size) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* test_path = test_create_temp_file("12345");
    ASSERT_NOT_NULL(test_path);
    
    long size = file_get_size(files, test_path);
    ASSERT_EQ(size, 5);
    
    test_remove_temp_file(test_path);
    free(test_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_read_nonexistent) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* content = file_read_text(files, "/nonexistent/file.txt");
    ASSERT_NULL(content);
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   JSON SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(json_suite);

TEST(test_json_injection) {
    TEST_START();
    JsonService* json = json_service_inject();
    ASSERT_NOT_NULL(json);
    ASSERT_STR_EQ(json->base.name, "json_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_create_object) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* obj = json_create_object(json);
    ASSERT_NOT_NULL(obj);
    ASSERT_EQ(obj->type, JSON_OBJECT);
    
    json_free(obj);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_create_array) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* arr = json_create_array(json);
    ASSERT_NOT_NULL(arr);
    ASSERT_EQ(arr->type, JSON_ARRAY);
    
    json_free(arr);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_create_string) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* str = json_create_string(json, "hello");
    ASSERT_NOT_NULL(str);
    ASSERT_EQ(str->type, JSON_STRING);
    ASSERT_STR_EQ(str->value.string, "hello");
    
    json_free(str);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_create_number) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* num = json_create_number(json, 42);
    ASSERT_NOT_NULL(num);
    ASSERT_EQ(num->type, JSON_NUMBER);
    ASSERT_EQ(num->value.number, 42);
    
    json_free(num);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_create_bool) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* boolean = json_create_bool(json, 1);
    ASSERT_NOT_NULL(boolean);
    ASSERT_EQ(boolean->type, JSON_BOOL);
    ASSERT_EQ(boolean->value.boolean, 1);
    
    json_free(boolean);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_create_null) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* null_val = json_create_null(json);
    ASSERT_NOT_NULL(null_val);
    ASSERT_EQ(null_val->type, JSON_NULL);
    
    json_free(null_val);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_object_set_get) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* obj = json_create_object(json);
    
    json_object_set(obj, "name", json_create_string(json, "test"));
    json_object_set(obj, "value", json_create_number(json, 123));
    json_object_set(obj, "active", json_create_bool(json, 1));
    
    JsonValue* name = json_object_get(obj, "name");
    ASSERT_NOT_NULL(name);
    ASSERT_STR_EQ(name->value.string, "test");
    
    JsonValue* value = json_object_get(obj, "value");
    ASSERT_NOT_NULL(value);
    ASSERT_EQ(value->value.number, 123);
    
    json_free(obj);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_array_push) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* arr = json_create_array(json);
    
    json_array_push(arr, json_create_number(json, 1));
    json_array_push(arr, json_create_number(json, 2));
    json_array_push(arr, json_create_number(json, 3));
    
    ASSERT_EQ(json_array_length(arr), 3);
    
    JsonValue* item = json_array_get(arr, 1);
    ASSERT_NOT_NULL(item);
    ASSERT_EQ(item->value.number, 2);
    
    json_free(arr);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_stringify_parse) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* obj = json_create_object(json);
    json_object_set(obj, "name", json_create_string(json, "John"));
    json_object_set(obj, "age", json_create_number(json, 30));
    
    char* str = json_stringify(obj, 2);
    ASSERT_NOT_NULL(str);
    ASSERT_GT(strlen(str), 0);
    
    /* Parse it back */
    JsonValue* parsed = json_parse(json, str);
    ASSERT_NOT_NULL(parsed);
    ASSERT_EQ(parsed->type, JSON_OBJECT);
    
    JsonValue* name = json_object_get(parsed, "name");
    ASSERT_NOT_NULL(name);
    ASSERT_STR_EQ(name->value.string, "John");
    
    free(str);
    json_free(obj);
    json_free(parsed);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_json_nested_object) {
    TEST_START();
    JsonService* json = json_service_inject();
    
    JsonValue* outer = json_create_object(json);
    JsonValue* inner = json_create_object(json);
    
    json_object_set(inner, "key", json_create_string(json, "value"));
    json_object_set(outer, "inner", inner);
    
    JsonValue* retrieved = json_object_get(outer, "inner");
    ASSERT_NOT_NULL(retrieved);
    ASSERT_EQ(retrieved->type, JSON_OBJECT);
    
    json_free(outer);
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   HASH SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(hash_suite);

TEST(test_hash_injection) {
    TEST_START();
    HashService* hash = hash_service_inject();
    ASSERT_NOT_NULL(hash);
    ASSERT_STR_EQ(hash->base.name, "hash_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_md5) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* md5 = hash_md5_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(md5);
    ASSERT_EQ(strlen(md5), 32);  /* MD5 is 128 bits = 32 hex chars */
    
    free(md5);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_md5_consistency) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* hash1 = hash_md5_hex("test", 4);
    char* hash2 = hash_md5_hex("test", 4);
    
    ASSERT_NOT_NULL(hash1);
    ASSERT_NOT_NULL(hash2);
    ASSERT_STR_EQ(hash1, hash2);
    
    free(hash1);
    free(hash2);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_sha1) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* sha1 = hash_sha1_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(sha1);
    ASSERT_EQ(strlen(sha1), 40);  /* SHA1 is 160 bits = 40 hex chars */
    
    free(sha1);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_sha256) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* sha256 = hash_sha256_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(sha256);
    ASSERT_EQ(strlen(sha256), 64);  /* SHA256 is 256 bits = 64 hex chars */
    
    free(sha256);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_crc32) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    uint32_t crc = hash_crc32("Hello, World!", 13);
    ASSERT_GT(crc, 0);  /* Should produce some value */
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_empty_input) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* md5 = hash_md5_hex("", 0);
    ASSERT_NOT_NULL(md5);
    ASSERT_EQ(strlen(md5), 32);
    
    free(md5);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_different_inputs) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* hash1 = hash_sha256_hex("input1", 6);
    char* hash2 = hash_sha256_hex("input2", 6);
    
    ASSERT_NOT_NULL(hash1);
    ASSERT_NOT_NULL(hash2);
    ASSERT_NE(strcmp(hash1, hash2), 0);  /* Should be different */
    
    free(hash1);
    free(hash2);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_binary_output) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    unsigned char* binary = hash_md5_binary("test", 4);
    ASSERT_NOT_NULL(binary);
    
    /* MD5 binary is 16 bytes */
    int is_zero = 1;
    for (int i = 0; i < 16; i++) {
        if (binary[i] != 0) {
            is_zero = 0;
            break;
        }
    }
    ASSERT_FALSE(is_zero);  /* Should not be all zeros */
    
    free(binary);
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   TIMER SERVICE TESTS (Basic - timing tests can be flaky)
   ============================================================================ */

TEST_SUITE_INIT(timer_suite);

TEST(test_timer_injection) {
    TEST_START();
    TimerService* timers = timer_service_inject();
    ASSERT_NOT_NULL(timers);
    ASSERT_STR_EQ(timers->base.name, "timer_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_timer_set_interval) {
    TEST_START();
    TimerService* timers = timer_service_inject();
    
    int timer_id = timer_set_interval(timers, 1000, NULL, NULL);
    ASSERT_GT(timer_id, 0);
    
    timer_clear(timers, timer_id);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_timer_set_timeout) {
    TEST_START();
    TimerService* timers = timer_service_inject();
    
    int timer_id = timer_set_timeout(timers, 100, NULL, NULL);
    ASSERT_GT(timer_id, 0);
    
    timer_update(timers);  /* Trigger the timeout */
    TEST_END(TEST_PASS, NULL);
}

TEST(test_timer_clear) {
    TEST_START();
    TimerService* timers = timer_service_inject();
    
    int timer_id = timer_set_interval(timers, 1000, NULL, NULL);
    ASSERT_GT(timer_id, 0);
    
    int result = timer_clear(timers, timer_id);
    ASSERT_EQ(result, 1);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_timer_active_count) {
    TEST_START();
    TimerService* timers = timer_service_inject();
    
    ASSERT_EQ(timer_get_active_count(timers), 0);
    
    int id1 = timer_set_interval(timers, 1000, NULL, NULL);
    int id2 = timer_set_interval(timers, 1000, NULL, NULL);
    
    ASSERT_EQ(timer_get_active_count(timers), 2);
    
    timer_clear(timers, id1);
    ASSERT_EQ(timer_get_active_count(timers), 1);
    
    timer_clear(timers, id2);
    ASSERT_EQ(timer_get_active_count(timers), 0);
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   MAIN - RUN ALL TESTS
   ============================================================================ */

int main(void) {
    printf("\n");
    printf("╔═══════════════════════════════════════════════════════════╗\n");
    printf("║        FOUNDATION SERVICES TEST SUITE                     ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    /* Initialize DI */
    if (app_module_init() != 0) {
        fprintf(stderr, "Failed to initialize app module\n");
        return 1;
    }
    
    LoggerService* logger = logger_service_inject();
    logger_log(logger, "INFO", "Starting foundation services tests...");
    
    /* Run test suites */
    test_suite_run(&logger_suite);
    test_suite_run(&event_suite);
    test_suite_run(&file_suite);
    test_suite_run(&json_suite);
    test_suite_run(&hash_suite);
    test_suite_run(&timer_suite);
    
    /* Report individual suites */
    printf("\n");
    printf("═══════════════════════════════════════════════════════════\n");
    printf("                    SUITE REPORTS\n");
    printf("═══════════════════════════════════════════════════════════\n");
    
    test_suite_report(&logger_suite);
    test_suite_report(&event_suite);
    test_suite_report(&file_suite);
    test_suite_report(&json_suite);
    test_suite_report(&hash_suite);
    test_suite_report(&timer_suite);
    
    /* Overall summary */
    TestSuite* suites[] = {
        &logger_suite,
        &event_suite,
        &file_suite,
        &json_suite,
        &hash_suite,
        &timer_suite
    };
    test_suite_summary(suites, 6);
    
    /* Cleanup */
    app_module_destroy();
    
    /* Return failure if any tests failed */
    int total_failed = 0;
    for (int i = 0; i < 6; i++) {
        total_failed += suites[i]->failed;
    }
    
    return total_failed > 0 ? 1 : 0;
}
