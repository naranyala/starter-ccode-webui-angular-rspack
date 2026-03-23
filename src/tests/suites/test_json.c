/* JSON Service Tests */

#include "tests/test_utils.h"
#include "services/json_service.h"

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
