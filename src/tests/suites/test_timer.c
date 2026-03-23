/* Timer Service Tests */

#include "tests/test_utils.h"
#include "services/timer_service.h"

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
    
    timer_update(timers);
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
