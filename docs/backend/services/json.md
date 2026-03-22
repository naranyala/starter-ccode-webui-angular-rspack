# JsonService

JSON parsing and generation service.

## Overview

JsonService provides a complete JSON implementation with:

- Recursive descent parser
- Full JSON spec support (objects, arrays, strings, numbers, booleans, null)
- Stringify with optional indentation
- File I/O support
- Memory management

## API Reference

### Types

```c
typedef enum {
    JSON_NULL,
    JSON_BOOL,
    JSON_NUMBER,
    JSON_STRING,
    JSON_ARRAY,
    JSON_OBJECT
} JsonType;

typedef struct JsonValue JsonValue;
```

### Parse/Stringify

```c
// Parse JSON text
JsonValue* json_parse(const char* text);

// Convert to string (indent: 0 for compact, >0 for pretty)
char* json_stringify(JsonValue* value, int indent);
```

### Create Values

```c
JsonValue* json_create_null(void);
JsonValue* json_create_bool(bool value);
JsonValue* json_create_number(double value);
JsonValue* json_create_string(const char* value);
JsonValue* json_create_array(void);
JsonValue* json_create_object(void);
```

### Array Operations

```c
int json_array_push(JsonValue* array, JsonValue* value);
JsonValue* json_array_get(JsonValue* array, size_t index);
size_t json_array_length(JsonValue* array);
```

### Object Operations

```c
int json_object_set(JsonValue* object, const char* key, JsonValue* value);
JsonValue* json_object_get(JsonValue* object, const char* key);
bool json_object_has(JsonValue* object, const char* key);
int json_object_remove(JsonValue* object, const char* key);
```

### Accessors

```c
JsonType json_type(JsonValue* value);
bool json_is_null(JsonValue* value);
bool json_is_string(JsonValue* value);
const char* json_as_string(JsonValue* value);
double json_as_number(JsonValue* value);
```

### File I/O

```c
int json_parse_file(const char* path, JsonValue** out_value);
int json_write_file(const char* path, JsonValue* value, int indent);
```

### Memory Management

```c
void json_free(JsonValue* value);
```

## Usage

### Parse JSON

```c
const char* json_text = "{\"name\": \"John\", \"age\": 30}";
JsonValue* root = json_parse(json_text);

JsonValue* name = json_object_get(root, "name");
JsonValue* age = json_object_get(root, "age");

printf("Name: %s, Age: %.0f\n", json_as_string(name), json_as_number(age));

json_free(root);
```

### Create JSON

```c
JsonValue* obj = json_create_object();
json_object_set(obj, "name", json_create_string("John"));
json_object_set(obj, "age", json_create_number(30));
json_object_set(obj, "active", json_create_bool(true));

char* json_str = json_stringify(obj, 2);
printf("%s\n", json_str);

free(json_str);
json_free(obj);
```

### Work with Arrays

```c
JsonValue* arr = json_create_array();
json_array_push(arr, json_create_number(1));
json_array_push(arr, json_create_number(2));
json_array_push(arr, json_create_number(3));

for (size_t i = 0; i < json_array_length(arr); i++) {
    JsonValue* item = json_array_get(arr, i);
    printf("%.0f\n", json_as_number(item));
}

json_free(arr);
```

### File Operations

```c
// Write to file
JsonValue* config = json_create_object();
json_object_set(config, "port", json_create_number(8080));
json_write_file("config.json", config, 2);
json_free(config);

// Read from file
JsonValue* loaded;
if (json_parse_file("config.json", &loaded) == 0) {
    JsonValue* port = json_object_get(loaded, "port");
    printf("Port: %.0f\n", json_as_number(port));
    json_free(loaded);
}
```

## Dependencies

None (foundation service)

## Related Services

- HttpService - Can parse HTTP response JSON
- ConfigService - Can load configuration from JSON

## Example: Configuration File

```c
// Load and parse config
JsonValue* config;
if (json_parse_file("app.json", &config) != 0) {
    // Handle error
    return;
}

// Read values
JsonValue* name = json_object_get(config, "app_name");
JsonValue* port = json_object_get(config, "port");
JsonValue* debug = json_object_get(config, "debug");

printf("App: %s, Port: %.0f, Debug: %s\n",
    json_as_string(name),
    json_as_number(port),
    json_as_bool(debug) ? "true" : "false");

json_free(config);
```
