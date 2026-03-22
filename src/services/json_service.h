/* JSON Service - Simple JSON parsing and generation (stb-style) */

#ifndef JSON_SERVICE_H
#define JSON_SERVICE_H

#include "di/di.h"
#include <stddef.h>
#include <stdbool.h>

/* JSON Value Types */
typedef enum {
    JSON_NULL,
    JSON_BOOL,
    JSON_NUMBER,
    JSON_STRING,
    JSON_ARRAY,
    JSON_OBJECT
} JsonType;

/* Forward declarations */
typedef struct JsonValue JsonValue;
typedef struct JsonPair JsonPair;

/* JSON Key-Value Pair (for objects) */
struct JsonPair {
    char* key;
    JsonValue* value;
};

/* JSON Array */
typedef struct {
    JsonValue** items;
    size_t count;
    size_t capacity;
} JsonArray;

/* JSON Object */
typedef struct {
    JsonPair* pairs;
    size_t count;
    size_t capacity;
} JsonObject;

/* JSON Value */
struct JsonValue {
    JsonType type;
    union {
        bool bool_val;
        double number_val;
        char* string_val;
        JsonArray* array;
        JsonObject* object;
    };
};

/* JSON Service */
typedef struct JsonService {
    DI_Service base;
} JsonService;

DI_DECLARE_SERVICE(JsonService, json_service);

/* Parse/Serialize */
JsonValue* json_parse(const char* text);
char* json_stringify(JsonValue* value, int indent);

/* Create JSON values */
JsonValue* json_create_null(void);
JsonValue* json_create_bool(bool value);
JsonValue* json_create_number(double value);
JsonValue* json_create_string(const char* value);
JsonValue* json_create_array(void);
JsonValue* json_create_object(void);

/* Array operations */
int json_array_push(JsonValue* array, JsonValue* value);
JsonValue* json_array_get(JsonValue* array, size_t index);
size_t json_array_length(JsonValue* array);

/* Object operations */
int json_object_set(JsonValue* object, const char* key, JsonValue* value);
JsonValue* json_object_get(JsonValue* object, const char* key);
bool json_object_has(JsonValue* object, const char* key);
int json_object_remove(JsonValue* object, const char* key);

/* Accessors */
JsonType json_type(JsonValue* value);
bool json_is_null(JsonValue* value);
bool json_is_bool(JsonValue* value);
bool json_is_number(JsonValue* value);
bool json_is_string(JsonValue* value);
bool json_is_array(JsonValue* value);
bool json_is_object(JsonValue* value);

bool json_as_bool(JsonValue* value);
double json_as_number(JsonValue* value);
const char* json_as_string(JsonValue* value);

/* Memory management */
void json_free(JsonValue* value);

/* Convenience */
int json_parse_file(const char* path, JsonValue** out_value);
int json_write_file(const char* path, JsonValue* value, int indent);

#endif /* JSON_SERVICE_H */
