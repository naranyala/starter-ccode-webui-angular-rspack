/* HTTP Service Implementation - Stub for future implementation */

#include "http_service.h"
#include <string.h>
#include <stdlib.h>

static HttpResponse* http_response_create(void) {
    HttpResponse* response = (HttpResponse*)calloc(1, sizeof(HttpResponse));
    if (response) {
        response->status_code = 0;
        response->body = NULL;
        response->body_length = 0;
        response->header_count = 0;
    }
    return response;
}

void http_response_free(HttpResponse* response) {
    if (!response) return;
    free(response->body);
    for (int i = 0; i < response->header_count; i++) {
        free(response->headers[i]);
    }
    free(response);
}

const char* http_get_status_text(int status_code) {
    switch (status_code) {
        case 200: return "OK";
        case 201: return "Created";
        case 204: return "No Content";
        case 301: return "Moved Permanently";
        case 302: return "Found";
        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 500: return "Internal Server Error";
        default: return "Unknown";
    }
}

DI_SERVICE_INIT(HttpService, http_service) {
    (void)self;
    self->logger = logger_service_inject();
    self->timeout_ms = 30000;
    return DI_OK;
}

DI_SERVICE_CLEANUP(HttpService, http_service) {
    (void)self;
}

DI_DEFINE_SERVICE(HttpService, http_service)

/* HTTP functions - stub implementations */
HttpResponse* http_get(HttpService* self, const char* url) {
    if (!self || !url) return NULL;
    
    logger_log(self->logger, "WARN", "HTTP GET not implemented: %s", url);
    
    HttpResponse* response = http_response_create();
    if (response) {
        response->status_code = 501; /* Not Implemented */
        response->body = strdup("HTTP client not implemented - use WebUI bridge for API calls");
        if (response->body) {
            response->body_length = strlen(response->body);
        }
    }
    return response;
}

HttpResponse* http_post(HttpService* self, const char* url, const char* body, const char* content_type) {
    (void)body;
    (void)content_type;
    return http_get(self, url);
}

HttpResponse* http_put(HttpService* self, const char* url, const char* body, const char* content_type) {
    (void)body;
    (void)content_type;
    return http_get(self, url);
}

HttpResponse* http_delete(HttpService* self, const char* url) {
    return http_get(self, url);
}
