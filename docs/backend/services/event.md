# Event Service

Pub/Sub event bus for application-wide event handling.

## Overview

EventService provides a publish/subscribe event system for loose coupling between components.

## API

### Event Management

| Function | Description |
|----------|-------------|
| `event_service_inject()` | Get event service instance |
| `event_publish(EventService*, event, data)` | Publish an event |
| `event_subscribe(EventService*, event, callback, user_data)` | Subscribe to event |
| `event_unsubscribe(EventService*, event, callback)` | Unsubscribe from event |

### Callback Signature

```c
typedef void (*EventCallback)(const char* event, void* data, void* user_data);
```

## Usage

```c
#include "services/event_service.h"

// Get service
EventService* events = event_service_inject();

// Define callback
void on_app_started(const char* event, void* data, void* user_data) {
    printf("App started: %s\n", (char*)data);
}

// Subscribe
event_subscribe(events, "app.started", on_app_started, NULL);

// Publish event
event_publish(events, "app.started", "Initialization complete");

// Unsubscribe
event_unsubscribe(events, "app.started", on_app_started);
```

## Common Events

| Event | Data | Description |
|-------|------|-------------|
| `app.started` | message | Application started |
| `app.closed` | - | Application closing |
| `db.connected` | db_path | Database connected |
| `db.error` | error_msg | Database error |

## Benefits

- Loose coupling between components
- Centralized event management
- Easy testing with mock callbacks

## Related Documentation

- [Logger Service](logger.md) - Logging events
- [Error Service](error.md) - Error event handling
