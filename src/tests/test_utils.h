/* Test Utilities and Helpers */

#ifndef TEST_UTILS_H
#define TEST_UTILS_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>
#include "di/di.h"
#include "services/logger_service.h"

/* ============================================================================
   TEST FRAMEWORK
   ============================================================================ */

/* Test result codes */
typedef enum {
    TEST_PASS = 0,
    TEST_FAIL = 1,
    TEST_SKIP = 2
} TestResult;

/* Test function type */
typedef TestResult (*test_fn)(void);

/* Test case structure */
typedef struct {
    const char* name;
    test_fn func;
    TestResult result;
    double duration_ms;
    char* message;
} TestCase;

/* Test suite structure */
typedef struct {
    const char* name;
    TestCase* tests;
    int test_count;
    int test_capacity;
    int passed;
    int failed;
    int skipped;
    double total_duration_ms;
} TestSuite;

/* Global test state */
static TestSuite* g_current_suite = NULL;
static clock_t g_test_start = 0;

/* ============================================================================
   TEST MACROS
   ============================================================================ */

/* Initialize a test suite */
#define TEST_SUITE_INIT(name) \
    TestSuite name = {0}; \
    name.name = #name; \
    name.test_capacity = 64; \
    name.tests = malloc(sizeof(TestCase) * name.test_capacity); \
    g_current_suite = &name

/* Finalize and report test suite */
#define TEST_SUITE_REPORT() \
    test_suite_report(g_current_suite); \
    free(g_current_suite->tests)

/* Define a test case */
#define TEST(name) \
    static TestResult test_##name(void)

/* Register a test case */
#define REGISTER_TEST(suite, name) \
    test_suite_register(&suite, #name, test_##name)

/* Start timing a test */
#define TEST_START() \
    g_test_start = clock()

/* End timing and record result */
#define TEST_END(result, msg) \
    return record_test_result(result, msg)

/* Assertions */
#define ASSERT(cond) \
    do { if (!(cond)) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Assertion failed: %s", #cond); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_EQ(a, b) \
    do { if ((a) != (b)) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected %lld == %lld", (long long)(a), (long long)(b)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_NE(a, b) \
    do { if ((a) == (b)) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected %lld != %lld", (long long)(a), (long long)(b)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_NULL(ptr) \
    do { if ((ptr) != NULL) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected NULL, got non-NULL"); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_NOT_NULL(ptr) \
    do { if ((ptr) == NULL) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected non-NULL, got NULL"); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_STR_EQ(a, b) \
    do { if (strcmp((a), (b)) != 0) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected strings equal: '%s' == '%s'", (a), (b)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_STR_CONTAINS(str, substr) \
    do { if (strstr((str), (substr)) == NULL) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected '%s' to contain '%s'", (str), (substr)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_TRUE(cond) ASSERT(cond)
#define ASSERT_FALSE(cond) ASSERT(!(cond))

#define ASSERT_LT(a, b) \
    do { if ((a) >= (b)) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected %lld < %lld", (long long)(a), (long long)(b)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_GT(a, b) \
    do { if ((a) <= (b)) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected %lld > %lld", (long long)(a), (long long)(b)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

#define ASSERT_RANGE(val, min, max) \
    do { if ((val) < (min) || (val) > (max)) { \
        char msg[256]; \
        snprintf(msg, sizeof(msg), "Expected %lld in range [%lld, %lld]", (long long)(val), (long long)(min), (long long)(max)); \
        return record_test_result(TEST_FAIL, msg); \
    } } while(0)

/* Skip a test */
#define SKIP_TEST(reason) \
    return record_test_result(TEST_SKIP, reason)

/* ============================================================================
   TEST RUNNER FUNCTIONS
   ============================================================================ */

static TestResult record_test_result(TestResult result, const char* message) {
    if (!g_current_suite || g_current_suite->test_count <= 0) {
        return result;
    }
    
    TestCase* test = &g_current_suite->tests[g_current_suite->test_count - 1];
    test->result = result;
    test->duration_ms = ((double)(clock() - g_test_start)) / CLOCKS_PER_SEC * 1000;
    
    if (message) {
        test->message = strdup(message);
    }
    
    switch (result) {
        case TEST_PASS:
            g_current_suite->passed++;
            break;
        case TEST_FAIL:
            g_current_suite->failed++;
            break;
        case TEST_SKIP:
            g_current_suite->skipped++;
            break;
    }
    
    g_current_suite->total_duration_ms += test->duration_ms;
    
    return result;
}

static void test_suite_register(TestSuite* suite, const char* name, test_fn func) {
    if (suite->test_count >= suite->test_capacity) {
        suite->test_capacity *= 2;
        suite->tests = realloc(suite->tests, sizeof(TestCase) * suite->test_capacity);
    }
    
    TestCase* test = &suite->tests[suite->test_count++];
    test->name = name;
    test->func = func;
    test->result = TEST_PASS;
    test->duration_ms = 0;
    test->message = NULL;
}

static void test_suite_run(TestSuite* suite) {
    LoggerService* logger = logger_service_inject();
    
    printf("\n");
    printf("┌─────────────────────────────────────────────────────────────┐\n");
    printf("│  Test Suite: %-52s│\n", suite->name);
    printf("└─────────────────────────────────────────────────────────────┘\n");
    printf("\n");
    
    for (int i = 0; i < suite->test_count; i++) {
        TestCase* test = &suite->tests[i];
        
        printf("  [%d/%d] %s... ", i + 1, suite->test_count, test->name);
        fflush(stdout);
        
        g_test_start = clock();
        TestResult result = test->func();
        test->result = result;
        test->duration_ms = ((double)(clock() - g_test_start)) / CLOCKS_PER_SEC * 1000;
        
        switch (result) {
            case TEST_PASS:
                printf("\033[0;32m✓ PASS\033[0m (%.2fms)\n", test->duration_ms);
                suite->passed++;
                break;
            case TEST_FAIL:
                printf("\033[0;31m✗ FAIL\033[0m (%.2fms)\n", test->duration_ms);
                if (test->message) {
                    printf("        └─ %s\n", test->message);
                }
                suite->failed++;
                break;
            case TEST_SKIP:
                printf("\033[0;33m○ SKIP\033[0m (%.2fms)\n", test->duration_ms);
                if (test->message) {
                    printf("        └─ %s\n", test->message);
                }
                suite->skipped++;
                break;
        }
        
        suite->total_duration_ms += test->duration_ms;
        
        if (logger && result == TEST_FAIL) {
            logger_log(logger, "ERROR", "Test failed: %s - %s", test->name, test->message ? test->message : "N/A");
        }
    }
}

static void test_suite_report(TestSuite* suite) {
    printf("\n");
    printf("┌─────────────────────────────────────────────────────────────┐\n");
    printf("│  Test Report: %-51s│\n", suite->name);
    printf("├─────────────────────────────────────────────────────────────┤\n");
    printf("│  Total:   %-55d│\n", suite->test_count);
    
    /* Color-coded counts */
    printf("│  Passed:  \033[0;32m%-55d\033[0m│\n", suite->passed);
    printf("│  Failed:  \033[0;31m%-55d\033[0m│\n", suite->failed);
    printf("│  Skipped: \033[0;33m%-55d\033[0m│\n", suite->skipped);
    
    printf("├─────────────────────────────────────────────────────────────┤\n");
    printf("│  Duration: %-46.2fms │\n", suite->total_duration_ms);
    
    double coverage = (suite->test_count > 0) ? 
        ((double)suite->passed / suite->test_count * 100) : 0;
    printf("│  Pass Rate: %-45.1f%% │\n", coverage);
    printf("└─────────────────────────────────────────────────────────────┘\n");
    
    if (suite->failed > 0) {
        printf("\n\033[0;31m  ❌ Some tests failed!\033[0m\n\n");
    } else if (suite->skipped > 0) {
        printf("\n\033[0;33m  ⚠️  All executed tests passed (%d skipped)\033[0m\n\n", suite->skipped);
    } else {
        printf("\n\033[0;32m  ✅ All tests passed!\033[0m\n\n");
    }
}

static void test_suite_summary(TestSuite** suites, int suite_count) {
    int total_tests = 0, total_passed = 0, total_failed = 0, total_skipped = 0;
    double total_duration = 0;
    
    for (int i = 0; i < suite_count; i++) {
        total_tests += suites[i]->test_count;
        total_passed += suites[i]->passed;
        total_failed += suites[i]->failed;
        total_skipped += suites[i]->skipped;
        total_duration += suites[i]->total_duration_ms;
    }
    
    printf("\n");
    printf("╔═══════════════════════════════════════════════════════════╗\n");
    printf("║              OVERALL TEST SUMMARY                         ║\n");
    printf("╠═══════════════════════════════════════════════════════════╣\n");
    printf("║  Test Suites: %-49d║\n", suite_count);
    printf("║  Total Tests: %-49d║\n", total_tests);
    printf("║  Passed:      \033[0;32m%-49d\033[0m║\n", total_passed);
    printf("║  Failed:      \033[0;31m%-49d\033[0m║\n", total_failed);
    printf("║  Skipped:     \033[0;33m%-49d\033[0m║\n", total_skipped);
    printf("║  Duration:    %-49.2fms ║\n", total_duration);
    
    double pass_rate = (total_tests > 0) ? ((double)total_passed / total_tests * 100) : 0;
    printf("║  Pass Rate:   %-48.1f%% ║\n", pass_rate);
    printf("╚═══════════════════════════════════════════════════════════╝\n");
}

/* ============================================================================
   TEST HELPERS
   ============================================================================ */

/* Create a temporary file for testing */
static char* test_create_temp_file(const char* content) {
    char* path = strdup("/tmp/test_XXXXXX");
    int fd = mkstemp(path);
    if (fd < 0) {
        free(path);
        return NULL;
    }
    
    if (content) {
        write(fd, content, strlen(content));
    }
    close(fd);
    return path;
}

/* Remove a temporary file */
static void test_remove_temp_file(const char* path) {
    if (path) {
        unlink(path);
    }
}

/* Generate random string */
static char* test_random_string(size_t length) {
    static const char* chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    char* str = malloc(length + 1);
    if (!str) return NULL;
    
    for (size_t i = 0; i < length; i++) {
        str[i] = chars[rand() % strlen(chars)];
    }
    str[length] = '\0';
    return str;
}

/* Sleep for milliseconds */
static void test_sleep_ms(int ms) {
    struct timespec ts = {0};
    ts.tv_sec = ms / 1000;
    ts.tv_nsec = (ms % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

#endif /* TEST_UTILS_H */
