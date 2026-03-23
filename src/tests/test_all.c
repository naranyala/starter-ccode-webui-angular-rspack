/* Main Test Runner - Includes all test suites */

#include <stdio.h>
#include "di/di.h"
#include "app_module.h"
#include "tests/test_utils.h"
#include "services/logger_service.h"

/* Include all test suites */
#include "tests/suites/test_logger.c"
#include "tests/suites/test_event.c"
#include "tests/suites/test_file.c"
#include "tests/suites/test_timer.c"
#include "tests/suites/test_json.c"
#include "tests/suites/test_hash.c"
#include "tests/suites/test_sqlite.c"
#include "tests/suites/test_auth.c"
#include "tests/suites/test_error.c"
#include "tests/suites/test_updater.c"

int main(void) {
    printf("\n");
    printf("╔═══════════════════════════════════════════════════════════╗\n");
    printf("║        COMPREHENSIVE BACKEND TEST SUITE                   ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    /* Initialize DI */
    if (app_module_init() != 0) {
        fprintf(stderr, "Failed to initialize app module\n");
        return 1;
    }
    
    LoggerService* logger = logger_service_inject();
    logger_log(logger, "INFO", "Starting comprehensive backend tests...");
    
    /* Run all test suites */
    printf("\n┌─────────────────────────────────────────────────────────────┐\n");
    printf("│  FOUNDATION SERVICES                                        │\n");
    printf("└─────────────────────────────────────────────────────────────┘\n");
    test_suite_run(&logger_suite);
    test_suite_run(&event_suite);
    test_suite_run(&file_suite);
    test_suite_run(&timer_suite);
    test_suite_run(&json_suite);
    test_suite_run(&hash_suite);
    
    printf("\n┌─────────────────────────────────────────────────────────────┐\n");
    printf("│  ENTERPRISE SERVICES                                        │\n");
    printf("└─────────────────────────────────────────────────────────────┘\n");
    test_suite_run(&sqlite_suite);
    test_suite_run(&auth_suite);
    test_suite_run(&error_suite);
    test_suite_run(&updater_suite);
    
    /* Overall summary */
    printf("\n");
    printf("═══════════════════════════════════════════════════════════\n");
    printf("                    SUITE REPORTS\n");
    printf("═══════════════════════════════════════════════════════════\n");
    
    TestSuite* suites[] = {
        &logger_suite,
        &event_suite,
        &file_suite,
        &timer_suite,
        &json_suite,
        &hash_suite,
        &sqlite_suite,
        &auth_suite,
        &error_suite,
        &updater_suite
    };
    
    const char* suite_names[] = {
        "Logger Service",
        "Event Service",
        "File Service",
        "Timer Service",
        "JSON Service",
        "Hash Service",
        "SQLite Service",
        "Auth Service",
        "Error Service",
        "Updater Service"
    };
    
    for (int i = 0; i < 10; i++) {
        printf("\n┌─────────────────────────────────────────────────────────────┐\n");
        printf("│  %-58s│\n", suite_names[i]);
        printf("├─────────────────────────────────────────────────────────────┤\n");
        printf("│  Tests:   %-53d│\n", suites[i]->test_count);
        printf("│  Passed:  %-53d│\n", suites[i]->passed);
        printf("│  Failed:  %-53d│\n", suites[i]->failed);
        printf("│  Skipped: %-53d│\n", suites[i]->skipped);
        printf("│  Duration: %-50.2fms │\n", suites[i]->total_duration_ms);
        double rate = suites[i]->test_count > 0 ? 
            (double)suites[i]->passed / suites[i]->test_count * 100 : 0;
        printf("│  Pass Rate: %-47.1f%% │\n", rate);
        printf("└─────────────────────────────────────────────────────────────┘\n");
    }
    
    test_suite_summary(suites, 10);
    
    /* Cleanup */
    app_module_destroy();
    
    /* Return failure if any tests failed */
    int total_failed = 0;
    for (int i = 0; i < 10; i++) {
        total_failed += suites[i]->failed;
    }
    
    return total_failed > 0 ? 1 : 0;
}
