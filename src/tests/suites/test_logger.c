/* Logger Service Tests */

#include "tests/test_utils.h"
#include "services/logger_service.h"

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
