/* Error Service Implementation - Centralized error tracking and reporting */

#include "error_service.h"
#include "logger_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

/* Default capacity */
#define DEFAULT_ERROR_CAPACITY 100

/* ==================== Helper Functions ==================== */

static ErrorContext* create_context(void) {
    ErrorContext* ctx = calloc(1, sizeof(ErrorContext));
    return ctx;
}

static void copy_context(ErrorContext* dest, const ErrorContext* src) {
    if (!dest || !src) return;
    
    dest->user_id = src->user_id ? strdup(src->user_id) : NULL;
    dest->session_id = src->session_id ? strdup(src->session_id) : NULL;
    dest->request_id = src->request_id ? strdup(src->request_id) : NULL;
    dest->ip_address = src->ip_address ? strdup(src->ip_address) : NULL;
    dest->user_agent = src->user_agent ? strdup(src->user_agent) : NULL;
    dest->stack_trace = src->stack_trace ? strdup(src->stack_trace) : NULL;
    dest->line_number = src->line_number;
    dest->file_name = src->file_name ? strdup(src->file_name) : NULL;
    dest->function_name = src->function_name ? strdup(src->function_name) : NULL;
}

static ErrorRecord* create_error(ErrorType type, ErrorSeverity severity,
                                  const char* message, const char* code) {
    ErrorRecord* error = calloc(1, sizeof(ErrorRecord));
    if (!error) return NULL;
    
    error->type = type;
    error->severity = severity;
    error->message = message ? strdup(message) : NULL;
    error->code = code ? strdup(code) : NULL;
    error->timestamp = time(NULL);
    error->context = NULL;
    error->is_reported = 0;
    error->is_resolved = 0;
    
    return error;
}

/* ==================== Initialization ==================== */

int error_service_init(ErrorService* self, const ErrorServiceConfig* config) {
    if (!self) return 0;
    
    self->errors = NULL;
    self->error_count = 0;
    self->error_capacity = DEFAULT_ERROR_CAPACITY;
    self->max_errors = config ? config->max_errors_in_memory : DEFAULT_ERROR_CAPACITY;
    self->auto_report = config ? config->auto_report : false;
    self->include_stack_trace = config ? config->include_stack_trace : true;
    self->global_handler = config ? config->global_handler : NULL;
    self->handler_user_data = config ? config->handler_user_data : NULL;
    self->log_file_path = config && config->log_file_path ? strdup(config->log_file_path) : NULL;
    
    /* Allocate error array */
    self->errors = malloc(self->error_capacity * sizeof(ErrorRecord*));
    if (!self->errors) {
        free(self->log_file_path);
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    if (logger) {
        logger_log(logger, "INFO", "ErrorService initialized with max %d errors", self->max_errors);
    }
    
    return 1;
}

int error_service_init_default(ErrorService* self) {
    return error_service_init(self, NULL);
}

/* ==================== Error Reporting ==================== */

static long long add_error_to_service(ErrorService* self, ErrorRecord* error) {
    if (!self || !error) return -1;
    
    /* Check if we need to expand capacity */
    if (self->error_count >= self->error_capacity) {
        int new_capacity = self->error_capacity * 2;
        ErrorRecord** new_errors = realloc(self->errors, new_capacity * sizeof(ErrorRecord*));
        if (!new_errors) {
            error_free_record(error);
            return -1;
        }
        self->errors = new_errors;
        self->error_capacity = new_capacity;
    }
    
    /* Remove oldest error if at max */
    if (self->error_count >= self->max_errors && self->error_count > 0) {
        error_free_record(self->errors[0]);
        memmove(self->errors, self->errors + 1, (self->error_count - 1) * sizeof(ErrorRecord*));
        self->error_count--;
    }
    
    /* Add new error */
    error->id = time(NULL) * 1000 + self->error_count;
    self->errors[self->error_count++] = error;
    
    /* Call global handler if set */
    if (self->global_handler) {
        self->global_handler(error, self->handler_user_data);
    }
    
    return error->id;
}

long long error_report(ErrorService* self, ErrorType type, ErrorSeverity severity,
                       const char* message, const char* error_code) {
    if (!self || !message) return -1;
    
    ErrorRecord* error = create_error(type, severity, message, error_code);
    if (!error) return -1;
    
    long long id = add_error_to_service(self, error);
    
    LoggerService* logger = logger_service_inject();
    if (logger) {
        const char* type_str = error_type_name(type);
        const char* sev_str = error_severity_name(severity);
        logger_log(logger, "ERROR", "[%s][%s] %s", type_str, sev_str, message);
    }
    
    return id;
}

long long error_report_app(ErrorService* self, const char* message) {
    return error_report(self, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_MEDIUM, message, NULL);
}

long long error_report_validation(ErrorService* self, const char* message) {
    return error_report(self, ERROR_TYPE_VALIDATION, ERROR_SEVERITY_LOW, message, NULL);
}

long long error_report_auth(ErrorService* self, const char* message) {
    return error_report(self, ERROR_TYPE_AUTHENTICATION, ERROR_SEVERITY_HIGH, message, NULL);
}

long long error_report_network(ErrorService* self, const char* message) {
    return error_report(self, ERROR_TYPE_NETWORK, ERROR_SEVERITY_MEDIUM, message, NULL);
}

long long error_report_database(ErrorService* self, const char* message) {
    return error_report(self, ERROR_TYPE_DATABASE, ERROR_SEVERITY_HIGH, message, NULL);
}

long long error_report_critical(ErrorService* self, const char* message) {
    return error_report(self, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_CRITICAL, message, "CRITICAL");
}

/* ==================== Error with Context ==================== */

long long error_report_with_context(ErrorService* self, ErrorType type, ErrorSeverity severity,
                                    const char* message, const ErrorContext* context) {
    if (!self || !message) return -1;
    
    ErrorRecord* error = create_error(type, severity, message, NULL);
    if (!error) return -1;
    
    if (context) {
        error->context = create_context();
        if (error->context) {
            copy_context(error->context, context);
        }
    }
    
    return add_error_to_service(self, error);
}

/* ==================== Error Retrieval ==================== */

const ErrorRecord* error_get_by_id(ErrorService* self, long long error_id) {
    if (!self || error_id < 0) return NULL;
    
    for (int i = 0; i < self->error_count; i++) {
        if (self->errors[i]->id == error_id) {
            return self->errors[i];
        }
    }
    
    return NULL;
}

const ErrorRecord* error_get_all(ErrorService* self, int* count) {
    if (!self) {
        if (count) *count = 0;
        return NULL;
    }
    
    if (count) *count = self->error_count;
    return (const ErrorRecord*)self->errors;
}

const ErrorRecord* error_get_by_type(ErrorService* self, ErrorType type, int* count) {
    static ErrorRecord* filtered[DEFAULT_ERROR_CAPACITY];
    int filtered_count = 0;
    
    if (!self || !count) {
        if (count) *count = 0;
        return NULL;
    }
    
    for (int i = 0; i < self->error_count && filtered_count < DEFAULT_ERROR_CAPACITY; i++) {
        if (self->errors[i]->type == type) {
            filtered[filtered_count++] = self->errors[i];
        }
    }
    
    *count = filtered_count;
    return (const ErrorRecord*)filtered;
}

const ErrorRecord* error_get_by_severity(ErrorService* self, ErrorSeverity severity, int* count) {
    static ErrorRecord* filtered[DEFAULT_ERROR_CAPACITY];
    int filtered_count = 0;
    
    if (!self || !count) {
        if (count) *count = 0;
        return NULL;
    }
    
    for (int i = 0; i < self->error_count && filtered_count < DEFAULT_ERROR_CAPACITY; i++) {
        if (self->errors[i]->severity >= severity) {
            filtered[filtered_count++] = self->errors[i];
        }
    }
    
    *count = filtered_count;
    return (const ErrorRecord*)filtered;
}

const ErrorRecord* error_get_unreported(ErrorService* self, int* count) {
    static ErrorRecord* filtered[DEFAULT_ERROR_CAPACITY];
    int filtered_count = 0;
    
    if (!self || !count) {
        if (count) *count = 0;
        return NULL;
    }
    
    for (int i = 0; i < self->error_count && filtered_count < DEFAULT_ERROR_CAPACITY; i++) {
        if (!self->errors[i]->is_reported) {
            filtered[filtered_count++] = self->errors[i];
        }
    }
    
    *count = filtered_count;
    return (const ErrorRecord*)filtered;
}

/* ==================== Error Management ==================== */

int error_mark_reported(ErrorService* self, long long error_id) {
    const ErrorRecord* error = error_get_by_id(self, error_id);
    if (!error) return 0;
    
    ((ErrorRecord*)error)->is_reported = 1;
    return 1;
}

int error_mark_resolved(ErrorService* self, long long error_id) {
    const ErrorRecord* error = error_get_by_id(self, error_id);
    if (!error) return 0;
    
    ((ErrorRecord*)error)->is_resolved = 1;
    return 1;
}

void error_clear_all(ErrorService* self) {
    if (!self) return;
    
    for (int i = 0; i < self->error_count; i++) {
        error_free_record(self->errors[i]);
    }
    
    self->error_count = 0;
}

void error_clear_reported(ErrorService* self) {
    if (!self) return;
    
    int write_idx = 0;
    for (int i = 0; i < self->error_count; i++) {
        if (!self->errors[i]->is_reported) {
            self->errors[write_idx++] = self->errors[i];
        } else {
            error_free_record(self->errors[i]);
        }
    }
    
    self->error_count = write_idx;
}

/* ==================== Error Persistence ==================== */

int error_save_to_file(ErrorService* self, const char* path) {
    if (!self || !path) return 0;
    
    FILE* file = fopen(path, "w");
    if (!file) return 0;
    
    for (int i = 0; i < self->error_count; i++) {
        ErrorRecord* error = self->errors[i];
        
        fprintf(file, "%lld|%d|%d|%s|%s|%ld|%d|%d\n",
                error->id,
                error->type,
                error->severity,
                error->message ? error->message : "",
                error->code ? error->code : "",
                (long)error->timestamp,
                error->is_reported,
                error->is_resolved);
    }
    
    fclose(file);
    return 1;
}

int error_load_from_file(ErrorService* self, const char* path) {
    if (!self || !path) return 0;
    
    FILE* file = fopen(path, "r");
    if (!file) return 0;
    
    char line[4096];
    while (fgets(line, sizeof(line), file)) {
        long long id;
        int type, severity, is_reported, is_resolved;
        long timestamp;
        char message[1024] = {0};
        char code[256] = {0};
        
        int parsed = sscanf(line, "%lld|%d|%d|%1023[^|]|%255[^|]|%ld|%d|%d",
                           &id, &type, &severity, message, code, &timestamp, &is_reported, &is_resolved);
        
        if (parsed >= 6) {
            ErrorRecord* error = create_error(type, severity, message, code[0] ? code : NULL);
            if (error) {
                error->id = id;
                error->timestamp = (time_t)timestamp;
                error->is_reported = is_reported;
                error->is_resolved = is_resolved;
                add_error_to_service(self, error);
            }
        }
    }
    
    fclose(file);
    return 1;
}

/* ==================== Error Utilities ==================== */

const char* error_type_name(ErrorType type) {
    switch (type) {
        case ERROR_TYPE_APPLICATION: return "APPLICATION";
        case ERROR_TYPE_VALIDATION: return "VALIDATION";
        case ERROR_TYPE_AUTHENTICATION: return "AUTHENTICATION";
        case ERROR_TYPE_AUTHORIZATION: return "AUTHORIZATION";
        case ERROR_TYPE_NETWORK: return "NETWORK";
        case ERROR_TYPE_DATABASE: return "DATABASE";
        case ERROR_TYPE_FILESYSTEM: return "FILESYSTEM";
        case ERROR_TYPE_UNKNOWN: return "UNKNOWN";
        default: return "UNKNOWN";
    }
}

const char* error_severity_name(ErrorSeverity severity) {
    switch (severity) {
        case ERROR_SEVERITY_LOW: return "LOW";
        case ERROR_SEVERITY_MEDIUM: return "MEDIUM";
        case ERROR_SEVERITY_HIGH: return "HIGH";
        case ERROR_SEVERITY_CRITICAL: return "CRITICAL";
        default: return "UNKNOWN";
    }
}

char* error_format(const ErrorRecord* error) {
    if (!error) return NULL;
    
    char buffer[2048];
    struct tm* tm_info = localtime(&error->timestamp);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);
    
    snprintf(buffer, sizeof(buffer),
             "[%s] [%s] [%s] %s (Code: %s, ID: %lld, Reported: %d, Resolved: %d)",
             timestamp,
             error_type_name(error->type),
             error_severity_name(error->severity),
             error->message ? error->message : "N/A",
             error->code ? error->code : "N/A",
             error->id,
             error->is_reported,
             error->is_resolved);
    
    return strdup(buffer);
}

/* ==================== Memory Management ==================== */

void error_free_context(ErrorContext* context) {
    if (!context) return;
    
    free(context->user_id);
    free(context->session_id);
    free(context->request_id);
    free(context->ip_address);
    free(context->user_agent);
    free(context->stack_trace);
    free(context->file_name);
    free(context->function_name);
    free(context);
}

void error_free_record(ErrorRecord* error) {
    if (!error) return;
    
    free(error->message);
    free(error->code);
    if (error->context) {
        error_free_context(error->context);
    }
    free(error);
}

/* ==================== DI Service Implementation ==================== */

ErrorService* error_service_inject(void) {
    void* service;
    DI_Error err = DI_Container_Get(DI_GetGlobalContainer(), "error_service", &service);
    if (err != DI_OK) {
        return NULL;
    }
    return (ErrorService*)service;
}

DI_Error error_service_provider(DI_Container* container, void** out_service) {
    LoggerService* logger = NULL;
    
    DI_Error err = DI_Container_Get(container, "logger_service", (void**)&logger);
    if (err != DI_OK) {
        return err;
    }
    
    ErrorService* self = (ErrorService*)calloc(1, sizeof(ErrorService));
    if (!self) {
        return DI_ERROR_OUT_OF_MEMORY;
    }
    
    self->base.name = "error_service";
    self->base.initialized = 0;
    self->base.destroy = error_service_destroy;
    
    if (!error_service_init_default(self)) {
        free(self);
        return DI_ERROR_OUT_OF_MEMORY;
    }
    
    self->base.initialized = 1;
    
    if (logger) {
        logger_log(logger, "INFO", "ErrorService created");
    }
    
    *out_service = self;
    return DI_OK;
}

void error_service_destroy(DI_Service* service) {
    if (!service) return;
    
    ErrorService* self = (ErrorService*)service;
    LoggerService* logger = logger_service_inject();
    
    if (self->base.initialized) {
        error_clear_all(self);
        free(self->errors);
        free(self->log_file_path);
        self->base.initialized = 0;
    }
    
    if (logger) {
        logger_log(logger, "INFO", "ErrorService destroyed");
    }
    
    free(self);
}
