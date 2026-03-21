/* Event Service - Pub/Sub event bus for decoupled communication */

#ifndef EVENT_SERVICE_H
#define EVENT_SERVICE_H

#include "di/di.h"
#include <stdbool.h>

#define EVENT_MAX_NAME 64
#define EVENT_MAX_HANDLERS 32
#define EVENT_MAX_PAYLOAD 1024

typedef struct EventListener EventListener;
typedef void (*EventHandler)(const char* event, const char* payload, void* user_data);

typedef struct EventListener {
    char event_name[EVENT_MAX_NAME];
    EventHandler handler;
    void* user_data;
    int active;
} EventListener;

typedef struct EventService {
    DI_Service base;
    EventListener listeners[EVENT_MAX_HANDLERS];
    int listener_count;
} EventService;

DI_DECLARE_SERVICE(EventService, event_service);

/* Event methods */
void event_subscribe(EventService* self, const char* event, EventHandler handler, void* user_data);
void event_unsubscribe(EventService* self, const char* event, EventHandler handler);
void event_emit(EventService* self, const char* event, const char* payload);
int event_get_listener_count(EventService* self, const char* event);

#endif /* EVENT_SERVICE_H */
