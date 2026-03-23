/* Updater Service Tests */

#include "tests/test_utils.h"
#include "services/updater_service.h"

TEST_SUITE_INIT(updater_suite);

TEST(test_updater_injection) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    ASSERT_NOT_NULL(updater);
    ASSERT_STR_EQ(updater->base.name, "updater_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_get_current_version) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    const char* version = updater_get_current_version(updater);
    ASSERT_NOT_NULL(version);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_state_names) {
    TEST_START();
    
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_IDLE), "idle");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_CHECKING), "checking");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_AVAILABLE), "available");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_DOWNLOADING), "downloading");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_VERIFYING), "verifying");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_READY), "ready");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_INSTALLED), "installed");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_ERROR), "error");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_get_state) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    UpdateState state = updater_get_state(updater);
    ASSERT_EQ(state, UPDATE_STATE_IDLE);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_reset) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    updater->state = UPDATE_STATE_CHECKING;
    updater_reset(updater);
    
    ASSERT_EQ(updater_get_state(updater), UPDATE_STATE_IDLE);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_set_server_url) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    updater_set_server_url(updater, "https://custom.server.com");
    
    ASSERT_NOT_NULL(updater->update_server_url);
    ASSERT_STR_CONTAINS(updater->update_server_url, "custom.server.com");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_set_check_interval) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    updater_set_check_interval(updater, 48);
    ASSERT_EQ(updater->check_interval_hours, 48);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_version_compare) {
    TEST_START();
    
    ASSERT_EQ(updater_compare_versions("1.0.0", "1.0.0"), 0);
    ASSERT_LT(updater_compare_versions("1.0.0", "2.0.0"), 0);
    ASSERT_GT(updater_compare_versions("2.0.0", "1.0.0"), 0);
    ASSERT_LT(updater_compare_versions("1.0.0", "1.1.0"), 0);
    ASSERT_LT(updater_compare_versions("1.1.0", "1.1.1"), 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_should_check) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    ASSERT_TRUE(updater_should_check(updater));
    
    updater->last_check = time(NULL);
    ASSERT_FALSE(updater_should_check(updater));
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_clear_error) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    updater->state = UPDATE_STATE_ERROR;
    updater_clear_error(updater);
    
    ASSERT_NULL(updater_get_error(updater));
    
    TEST_END(TEST_PASS, NULL);
}
