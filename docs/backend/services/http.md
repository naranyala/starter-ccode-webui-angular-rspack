# HTTP Service

HTTP client for making HTTP requests.

## Overview

HttpService provides HTTP client functionality using CivetWeb.

## API

### Request Functions

| Function | Description |
|----------|-------------|
| `http_get(HttpService*, url)` | GET request |
| `http_post(HttpService*, url, body)` | POST request |
| `http_put(HttpService*, url, body)` | PUT request |
| `http_delete(HttpService*, url)` | DELETE request |

### Response

| Field | Type | Description |
|-------|------|-------------|
| `status_code` | int | HTTP status code |
| `body` | char* | Response body |
| `headers` | char** | Response headers |

## Usage

```c
#include "services/http_service.h"

// Get service
HttpService* http = http_service_inject();

// Simple GET request
HttpResponse* res = http_get(http, "https://api.example.com/data");
if (res && res->status_code == 200) {
    printf("Response: %s\n", res->body);
}
http_response_free(res);

// POST request
HttpResponse* res = http_post(http, "https://api.example.com/users", 
    "{\"name\": \"John\"}");
http_response_free(res);
```

## Related Documentation

- [Updater Service](updater.md) - Update downloads
