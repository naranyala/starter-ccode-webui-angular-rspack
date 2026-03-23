/* Event Service Tests */

#include "tests/test_utils.h"
#include "services/event_service.h"

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
