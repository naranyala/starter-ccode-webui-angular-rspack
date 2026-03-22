/* JSON Service Implementation - Simple recursive descent parser */

#include "json_service.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>

/* ============ Memory Management ============ */

static JsonValue* json_value_create(JsonType type) {
    JsonValue* val = (JsonValue*)calloc(1, sizeof(JsonValue));
    if (val) val->type = type;
    return val;
}

JsonValue* json_create_null(void) {
    return json_value_create(JSON_NULL);
}

JsonValue* json_create_bool(bool value) {
    JsonValue* val = json_value_create(JSON_BOOL);
    if (val) val->bool_val = value;
    return val;
}

JsonValue* json_create_number(double value) {
    JsonValue* val = json_value_create(JSON_NUMBER);
    if (val) val->number_val = value;
    return val;
}

JsonValue* json_create_string(const char* value) {
    if (!value) return NULL;
    JsonValue* val = json_value_create(JSON_STRING);
    if (val) {
        val->string_val = strdup(value);
        if (!val->string_val) {
            free(val);
            return NULL;
        }
    }
    return val;
}

JsonValue* json_create_array(void) {
    JsonValue* val = json_value_create(JSON_ARRAY);
    if (val) {
        val->array = (JsonArray*)calloc(1, sizeof(JsonArray));
        if (!val->array) {
            free(val);
            return NULL;
        }
        val->array->capacity = 8;
        val->array->items = (JsonValue**)calloc(val->array->capacity, sizeof(JsonValue*));
        if (!val->array->items) {
            free(val->array);
            free(val);
            return NULL;
        }
    }
    return val;
}

JsonValue* json_create_object(void) {
    JsonValue* val = json_value_create(JSON_OBJECT);
    if (val) {
        val->object = (JsonObject*)calloc(1, sizeof(JsonObject));
        if (!val->object) {
            free(val);
            return NULL;
        }
        val->object->capacity = 8;
        val->object->pairs = (JsonPair*)calloc(val->object->capacity, sizeof(JsonPair));
        if (!val->object->pairs) {
            free(val->object);
            free(val);
            return NULL;
        }
    }
    return val;
}

void json_free(JsonValue* value) {
    if (!value) return;
    
    switch (value->type) {
        case JSON_STRING:
            free(value->string_val);
            break;
        case JSON_ARRAY:
            if (value->array) {
                for (size_t i = 0; i < value->array->count; i++) {
                    json_free(value->array->items[i]);
                }
                free(value->array->items);
                free(value->array);
            }
            break;
        case JSON_OBJECT:
            if (value->object) {
                for (size_t i = 0; i < value->object->count; i++) {
                    free(value->object->pairs[i].key);
                    json_free(value->object->pairs[i].value);
                }
                free(value->object->pairs);
                free(value->object);
            }
            break;
        default:
            break;
    }
    free(value);
}

/* ============ Array Operations ============ */

int json_array_push(JsonValue* array, JsonValue* value) {
    if (!array || array->type != JSON_ARRAY || !value) return -1;
    
    JsonArray* arr = array->array;
    if (arr->count >= arr->capacity) {
        size_t new_cap = arr->capacity * 2;
        JsonValue** new_items = (JsonValue**)realloc(arr->items, new_cap * sizeof(JsonValue*));
        if (!new_items) return -1;
        arr->items = new_items;
        arr->capacity = new_cap;
    }
    arr->items[arr->count++] = value;
    return 0;
}

JsonValue* json_array_get(JsonValue* array, size_t index) {
    if (!array || array->type != JSON_ARRAY) return NULL;
    if (index >= array->array->count) return NULL;
    return array->array->items[index];
}

size_t json_array_length(JsonValue* array) {
    if (!array || array->type != JSON_ARRAY) return 0;
    return array->array->count;
}

/* ============ Object Operations ============ */

int json_object_set(JsonValue* object, const char* key, JsonValue* value) {
    if (!object || object->type != JSON_OBJECT || !key || !value) return -1;
    
    JsonObject* obj = object->object;
    
    /* Check if key exists */
    for (size_t i = 0; i < obj->count; i++) {
        if (strcmp(obj->pairs[i].key, key) == 0) {
            json_free(obj->pairs[i].value);
            obj->pairs[i].value = value;
            return 0;
        }
    }
    
    /* Expand if needed */
    if (obj->count >= obj->capacity) {
        size_t new_cap = obj->capacity * 2;
        JsonPair* new_pairs = (JsonPair*)realloc(obj->pairs, new_cap * sizeof(JsonPair));
        if (!new_pairs) return -1;
        obj->pairs = new_pairs;
        obj->capacity = new_cap;
    }
    
    obj->pairs[obj->count].key = strdup(key);
    obj->pairs[obj->count].value = value;
    obj->count++;
    return 0;
}

JsonValue* json_object_get(JsonValue* object, const char* key) {
    if (!object || object->type != JSON_OBJECT || !key) return NULL;
    
    JsonObject* obj = object->object;
    for (size_t i = 0; i < obj->count; i++) {
        if (strcmp(obj->pairs[i].key, key) == 0) {
            return obj->pairs[i].value;
        }
    }
    return NULL;
}

bool json_object_has(JsonValue* object, const char* key) {
    return json_object_get(object, key) != NULL;
}

int json_object_remove(JsonValue* object, const char* key) {
    if (!object || object->type != JSON_OBJECT || !key) return -1;
    
    JsonObject* obj = object->object;
    for (size_t i = 0; i < obj->count; i++) {
        if (strcmp(obj->pairs[i].key, key) == 0) {
            free(obj->pairs[i].key);
            json_free(obj->pairs[i].value);
            /* Shift remaining */
            for (size_t j = i; j < obj->count - 1; j++) {
                obj->pairs[j] = obj->pairs[j + 1];
            }
            obj->count--;
            return 0;
        }
    }
    return -1;
}

/* ============ Accessors ============ */

JsonType json_type(JsonValue* value) {
    return value ? value->type : JSON_NULL;
}

bool json_is_null(JsonValue* value) {
    return !value || value->type == JSON_NULL;
}

bool json_is_bool(JsonValue* value) {
    return value && value->type == JSON_BOOL;
}

bool json_is_number(JsonValue* value) {
    return value && value->type == JSON_NUMBER;
}

bool json_is_string(JsonValue* value) {
    return value && value->type == JSON_STRING;
}

bool json_is_array(JsonValue* value) {
    return value && value->type == JSON_ARRAY;
}

bool json_is_object(JsonValue* value) {
    return value && value->type == JSON_OBJECT;
}

bool json_as_bool(JsonValue* value) {
    if (!value) return false;
    if (value->type == JSON_BOOL) return value->bool_val;
    if (value->type == JSON_NUMBER) return value->number_val != 0;
    if (value->type == JSON_STRING) return strlen(value->string_val) > 0;
    return false;
}

double json_as_number(JsonValue* value) {
    if (!value) return 0;
    if (value->type == JSON_NUMBER) return value->number_val;
    if (value->type == JSON_BOOL) return value->bool_val ? 1 : 0;
    return 0;
}

const char* json_as_string(JsonValue* value) {
    if (!value) return "";
    if (value->type == JSON_STRING) return value->string_val;
    return "";
}

/* ============ Parser ============ */

typedef struct {
    const char* text;
    size_t pos;
    size_t len;
} JsonParser;

static void skip_whitespace(JsonParser* p) {
    while (p->pos < p->len && isspace((unsigned char)p->text[p->pos])) {
        p->pos++;
    }
}

static char peek(JsonParser* p) {
    skip_whitespace(p);
    return p->pos < p->len ? p->text[p->pos] : '\0';
}

static char advance(JsonParser* p) {
    skip_whitespace(p);
    return p->pos < p->len ? p->text[p->pos++] : '\0';
}

static int match(JsonParser* p, char c) {
    if (peek(p) == c) {
        p->pos++;
        return 1;
    }
    return 0;
}

static JsonValue* parse_value(JsonParser* p);

static JsonValue* parse_string(JsonParser* p) {
    if (advance(p) != '"') return NULL;
    
    size_t start = p->pos;
    size_t len = 0;
    
    while (p->pos < p->len && p->text[p->pos] != '"') {
        if (p->text[p->pos] == '\\' && p->pos + 1 < p->len) {
            p->pos++; /* Skip escape char */
        }
        p->pos++;
        len++;
    }
    
    if (p->pos >= p->len || p->text[p->pos] != '"') return NULL;
    p->pos++; /* Skip closing quote */
    
    char* str = (char*)malloc(len + 1);
    if (!str) return NULL;
    
    /* Copy with escape handling */
    size_t i = 0, j = 0;
    while (i < len) {
        char c = p->text[start + i];
        if (c == '\\' && i + 1 < len) {
            i++;
            c = p->text[start + i];
            switch (c) {
                case 'n': str[j++] = '\n'; break;
                case 't': str[j++] = '\t'; break;
                case 'r': str[j++] = '\r'; break;
                case '\\': str[j++] = '\\'; break;
                case '"': str[j++] = '"'; break;
                case '/': str[j++] = '/'; break;
                default: str[j++] = c; break;
            }
        } else {
            str[j++] = c;
        }
        i++;
    }
    str[j] = '\0';
    
    JsonValue* val = json_create_string(str);
    free(str);
    return val;
}

static JsonValue* parse_number(JsonParser* p) {
    size_t start = p->pos;
    int is_float = 0;
    
    if (p->text[p->pos] == '-') p->pos++;
    
    while (p->pos < p->len && isdigit((unsigned char)p->text[p->pos])) {
        p->pos++;
    }
    
    if (p->pos < p->len && p->text[p->pos] == '.') {
        is_float = 1;
        p->pos++;
        while (p->pos < p->len && isdigit((unsigned char)p->text[p->pos])) {
            p->pos++;
        }
    }
    
    if (p->pos < p->len && (p->text[p->pos] == 'e' || p->text[p->pos] == 'E')) {
        is_float = 1;
        p->pos++;
        if (p->pos < p->len && (p->text[p->pos] == '+' || p->text[p->pos] == '-')) {
            p->pos++;
        }
        while (p->pos < p->len && isdigit((unsigned char)p->text[p->pos])) {
            p->pos++;
        }
    }
    
    size_t len = p->pos - start;
    char* num_str = (char*)malloc(len + 1);
    if (!num_str) return NULL;
    
    strncpy(num_str, p->text + start, len);
    num_str[len] = '\0';
    
    double val = is_float ? strtod(num_str, NULL) : (double)strtoll(num_str, NULL, 10);
    free(num_str);
    
    return json_create_number(val);
}

static JsonValue* parse_array(JsonParser* p) {
    if (advance(p) != '[') return NULL;
    
    JsonValue* arr = json_create_array();
    if (!arr) return NULL;
    
    if (match(p, ']')) return arr;
    
    while (1) {
        JsonValue* item = parse_value(p);
        if (!item || json_array_push(arr, item) < 0) {
            json_free(arr);
            return NULL;
        }
        
        if (match(p, ']')) return arr;
        if (!match(p, ',')) {
            json_free(arr);
            return NULL;
        }
    }
}

static JsonValue* parse_object(JsonParser* p) {
    if (advance(p) != '{') return NULL;
    
    JsonValue* obj = json_create_object();
    if (!obj) return NULL;
    
    if (match(p, '}')) return obj;
    
    while (1) {
        JsonValue* key = parse_value(p);
        if (!key || key->type != JSON_STRING) {
            json_free(obj);
            return NULL;
        }
        
        if (!match(p, ':')) {
            json_free(key);
            json_free(obj);
            return NULL;
        }
        
        JsonValue* value = parse_value(p);
        if (!value) {
            json_free(key);
            json_free(obj);
            return NULL;
        }
        
        json_object_set(obj, key->string_val, value);
        json_free(key);
        
        if (match(p, '}')) return obj;
        if (!match(p, ',')) {
            json_free(obj);
            return NULL;
        }
    }
}

static JsonValue* parse_value(JsonParser* p) {
    char c = peek(p);
    
    if (c == '"') return parse_string(p);
    if (c == '[') return parse_array(p);
    if (c == '{') return parse_object(p);
    if (c == 't') { /* true */
        if (p->pos + 4 <= p->len && strncmp(p->text + p->pos, "true", 4) == 0) {
            p->pos += 4;
            return json_create_bool(true);
        }
        return NULL;
    }
    if (c == 'f') { /* false */
        if (p->pos + 5 <= p->len && strncmp(p->text + p->pos, "false", 5) == 0) {
            p->pos += 5;
            return json_create_bool(false);
        }
        return NULL;
    }
    if (c == 'n') { /* null */
        if (p->pos + 4 <= p->len && strncmp(p->text + p->pos, "null", 4) == 0) {
            p->pos += 4;
            return json_create_null();
        }
        return NULL;
    }
    if (c == '-' || isdigit((unsigned char)c)) {
        return parse_number(p);
    }
    
    return NULL;
}

JsonValue* json_parse(const char* text) {
    if (!text) return NULL;
    
    JsonParser parser = {
        .text = text,
        .pos = 0,
        .len = strlen(text)
    };
    
    return parse_value(&parser);
}

/* ============ Stringify ============ */

static void stringify_value(JsonValue* value, char** buf, size_t* len, size_t* cap, int indent, int depth);

static void append_char(char** buf, size_t* len, size_t* cap, char c) {
    if (*len + 2 > *cap) {
        *cap *= 2;
        *buf = (char*)realloc(*buf, *cap);
    }
    (*buf)[(*len)++] = c;
    (*buf)[*len] = '\0';
}

static void append_str(char** buf, size_t* len, size_t* cap, const char* str) {
    size_t slen = strlen(str);
    while (*len + slen + 2 > *cap) {
        *cap *= 2;
        *buf = (char*)realloc(*buf, *cap);
    }
    memcpy(*buf + *len, str, slen);
    *len += slen;
    (*buf)[*len] = '\0';
}

static void append_indent(char** buf, size_t* len, size_t* cap, int depth) {
    for (int i = 0; i < depth; i++) {
        append_str(buf, len, cap, "  ");
    }
}

static void stringify_string(char** buf, size_t* len, size_t* cap, const char* str) {
    append_char(buf, len, cap, '"');
    for (const char* p = str; *p; p++) {
        switch (*p) {
            case '"': append_str(buf, len, cap, "\\\""); break;
            case '\\': append_str(buf, len, cap, "\\\\"); break;
            case '\n': append_str(buf, len, cap, "\\n"); break;
            case '\r': append_str(buf, len, cap, "\\r"); break;
            case '\t': append_str(buf, len, cap, "\\t"); break;
            default: append_char(buf, len, cap, *p); break;
        }
    }
    append_char(buf, len, cap, '"');
}

static void stringify_value(JsonValue* value, char** buf, size_t* len, size_t* cap, int indent, int depth) {
    if (!value) {
        append_str(buf, len, cap, "null");
        return;
    }
    
    switch (value->type) {
        case JSON_NULL:
            append_str(buf, len, cap, "null");
            break;
        case JSON_BOOL:
            append_str(buf, len, cap, value->bool_val ? "true" : "false");
            break;
        case JSON_NUMBER: {
            char num[64];
            if (value->number_val == (long long)value->number_val) {
                snprintf(num, sizeof(num), "%lld", (long long)value->number_val);
            } else {
                snprintf(num, sizeof(num), "%g", value->number_val);
            }
            append_str(buf, len, cap, num);
            break;
        }
        case JSON_STRING:
            stringify_string(buf, len, cap, value->string_val);
            break;
        case JSON_ARRAY: {
            append_char(buf, len, cap, '[');
            JsonArray* arr = value->array;
            for (size_t i = 0; i < arr->count; i++) {
                if (i > 0) append_char(buf, len, cap, ',');
                if (indent > 0) {
                    append_char(buf, len, cap, '\n');
                    append_indent(buf, len, cap, depth + 1);
                }
                stringify_value(arr->items[i], buf, len, cap, indent, depth + 1);
            }
            if (indent > 0 && arr->count > 0) {
                append_char(buf, len, cap, '\n');
                append_indent(buf, len, cap, depth);
            }
            append_char(buf, len, cap, ']');
            break;
        }
        case JSON_OBJECT: {
            append_char(buf, len, cap, '{');
            JsonObject* obj = value->object;
            for (size_t i = 0; i < obj->count; i++) {
                if (i > 0) append_char(buf, len, cap, ',');
                if (indent > 0) {
                    append_char(buf, len, cap, '\n');
                    append_indent(buf, len, cap, depth + 1);
                }
                stringify_string(buf, len, cap, obj->pairs[i].key);
                append_char(buf, len, cap, ':');
                if (indent > 0) append_char(buf, len, cap, ' ');
                stringify_value(obj->pairs[i].value, buf, len, cap, indent, depth + 1);
            }
            if (indent > 0 && obj->count > 0) {
                append_char(buf, len, cap, '\n');
                append_indent(buf, len, cap, depth);
            }
            append_char(buf, len, cap, '}');
            break;
        }
    }
}

char* json_stringify(JsonValue* value, int indent) {
    size_t cap = 1024;
    size_t len = 0;
    char* buf = (char*)malloc(cap);
    if (!buf) return NULL;
    buf[0] = '\0';
    
    stringify_value(value, &buf, &len, &cap, indent, 0);
    return buf;
}

/* ============ File I/O ============ */

int json_parse_file(const char* path, JsonValue** out_value) {
    FILE* f = fopen(path, "r");
    if (!f) return -1;
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char* text = (char*)malloc(size + 1);
    if (!text) {
        fclose(f);
        return -1;
    }
    
    fread(text, 1, size, f);
    text[size] = '\0';
    fclose(f);
    
    *out_value = json_parse(text);
    free(text);
    
    return *out_value ? 0 : -1;
}

int json_write_file(const char* path, JsonValue* value, int indent) {
    char* text = json_stringify(value, indent);
    if (!text) return -1;
    
    FILE* f = fopen(path, "w");
    if (!f) {
        free(text);
        return -1;
    }
    
    fprintf(f, "%s", text);
    fclose(f);
    free(text);
    return 0;
}

/* ============ JsonService Implementation ============ */

DI_SERVICE_INIT(JsonService, json_service) {
    (void)self;
    return DI_OK;
}

DI_SERVICE_CLEANUP(JsonService, json_service) {
    (void)self;
}

DI_DEFINE_SERVICE(JsonService, json_service)
