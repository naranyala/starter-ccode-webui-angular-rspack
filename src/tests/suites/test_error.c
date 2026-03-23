/* Error Service Tests */

#include "tests/test_utils.h"
#include "services/error_service.h"

TEST_SUITE_INIT(error_suite);

TEST(test_error_injection) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    ASSERT_NOT_NULL(errors);
    ASSERT_STR_EQ(errors->base.name, "error_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_report_app) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "Test application error");
    ASSERT_GT(id, 0);
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_NOT_NULL(error);
    ASSERT_STR_EQ(error->message, "Test application error");
    ASSERT_EQ(error->type, ERROR_TYPE_APPLICATION);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_report_by_type) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id1 = error_report_validation(errors, "Validation failed");
    long long id2 = error_report_auth(errors, "Auth failed");
    long long id3 = error_report_network(errors, "Network error");
    long long id4 = error_report_database(errors, "DB error");
    
    ASSERT_GT(id1, 0);
    ASSERT_GT(id2, 0);
    ASSERT_GT(id3, 0);
    ASSERT_GT(id4, 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_report_critical) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_critical(errors, "Critical system failure");
    ASSERT_GT(id, 0);
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_NOT_NULL(error);
    ASSERT_EQ(error->severity, ERROR_SEVERITY_CRITICAL);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_get_all) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    error_report_app(errors, "Error 1");
    error_report_app(errors, "Error 2");
    error_report_app(errors, "Error 3");
    
    int count = 0;
    const ErrorRecord* all = error_get_all(errors, &count);
    ASSERT_EQ(count, 3);
    ASSERT_NOT_NULL(all);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_get_by_severity) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_LOW, "Low", NULL);
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_MEDIUM, "Medium", NULL);
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_HIGH, "High", NULL);
    error_report_critical(errors, "Critical");
    
    int count = 0;
    const ErrorRecord* high_errors = error_get_by_severity(errors, ERROR_SEVERITY_HIGH, &count);
    ASSERT_EQ(count, 2);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_get_by_type) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    error_report_database(errors, "DB error 1");
    error_report_database(errors, "DB error 2");
    error_report_network(errors, "Network error");
    
    int count = 0;
    const ErrorRecord* db_errors = error_get_by_type(errors, ERROR_TYPE_DATABASE, &count);
    ASSERT_EQ(count, 2);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_mark_reported) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "To be reported");
    ASSERT_TRUE(error_mark_reported(errors, id));
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_TRUE(error->is_reported);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_mark_resolved) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "To be resolved");
    ASSERT_TRUE(error_mark_resolved(errors, id));
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_TRUE(error->is_resolved);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_clear_reported) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id1 = error_report_app(errors, "Keep");
    long long id2 = error_report_app(errors, "Remove");
    error_mark_reported(errors, id2);
    
    error_clear_reported(errors);
    
    int count = 0;
    error_get_all(errors, &count);
    ASSERT_EQ(count, 1);
    
    const ErrorRecord* remaining = error_get_by_id(errors, id1);
    ASSERT_NOT_NULL(remaining);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_type_names) {
    TEST_START();
    
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_APPLICATION), "APPLICATION");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_VALIDATION), "VALIDATION");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_AUTHENTICATION), "AUTHENTICATION");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_NETWORK), "NETWORK");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_DATABASE), "DATABASE");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_severity_names) {
    TEST_START();
    
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_LOW), "LOW");
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_MEDIUM), "MEDIUM");
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_HIGH), "HIGH");
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_CRITICAL), "CRITICAL");
    
    TEST_END(TEST_PASS, NULL);
}
