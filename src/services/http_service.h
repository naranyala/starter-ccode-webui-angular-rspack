/* HTTP Service - Simple HTTP client using CivetWeb */

#ifndef HTTP_SERVICE_H
#define HTTP_SERVICE_H

#include "di/di.h"
#include "services/logger_service.h"

#define HTTP_MAX_HEADERS 32
#define HTTP_MAX_URL 512
#define HTTP_MAX_RESPONSE 65536

typedef struct HttpResponse {
    int status_code;
    char* body;
    size_t body_length;
    char* headers[HTTP_MAX_HEADERS];
    int header_count;
} HttpResponse;

typedef struct HttpService {
    DI_Service base;
    LoggerService* logger;
    int timeout_ms;
} HttpService;

DI_DECLARE_SERVICE(HttpService, http_service);

/* HTTP methods */
HttpResponse* http_get(HttpService* self, const char* url);
HttpResponse* http_post(HttpService* self, const char* url, const char* body, const char* content_type);
HttpResponse* http_put(HttpService* self, const char* url, const char* body, const char* content_type);
HttpResponse* http_delete(HttpService* self, const char* url);
void http_response_free(HttpResponse* response);
const char* http_get_status_text(int status_code);

#endif /* HTTP_SERVICE_H */
