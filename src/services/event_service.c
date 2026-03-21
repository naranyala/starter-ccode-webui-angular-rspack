/* Event Service Implementation - Pub/Sub event bus */

#include "services/event_service.h"
#include "services/logger_service.h"
#include <string.h>
#include <stdio.h>

DI_SERVICE_INIT(EventService, event_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    self->listener_count = 0;
    memset(self->listeners, 0, sizeof(self->listeners));
    
    return DI_OK;
}

DI_SERVICE_CLEANUP(EventService, event_service) {
    if (!self) return;
    self->listener_count = 0;
}

DI_DEFINE_SERVICE(EventService, event_service)

void event_subscribe(EventService* self, const char* event, EventHandler handler, void* user_data) {
    if (!self || !event || !handler) return;
    if (self->listener_count >= EVENT_MAX_HANDLERS) {
        fprintf(stderr, "EventService: Max listeners reached\n");
        return;
    }
    
    EventListener* listener = &self->listeners[self->listener_count];
    strncpy(listener->event_name, event, EVENT_MAX_NAME - 1);
    listener->event_name[EVENT_MAX_NAME - 1] = '\0';
    listener->handler = handler;
    listener->user_data = user_data;
    listener->active = 1;
    
    self->listener_count++;
}

void event_unsubscribe(EventService* self, const char* event, EventHandler handler) {
    if (!self || !event || !handler) return;
    
    for (int i = 0; i < self->listener_count; i++) {
        EventListener* listener = &self->listeners[i];
        if (listener->active && 
            strcmp(listener->event_name, event) == 0 && 
            listener->handler == handler) {
            listener->active = 0;
            return;
        }
    }
}

void event_emit(EventService* self, const char* event, const char* payload) {
    if (!self || !event) return;
    
    for (int i = 0; i < self->listener_count; i++) {
        EventListener* listener = &self->listeners[i];
        if (listener->active && strcmp(listener->event_name, event) == 0) {
            listener->handler(event, payload ? payload : "", listener->user_data);
        }
    }
}

int event_get_listener_count(EventService* self, const char* event) {
    if (!self || !event) return 0;
    
    int count = 0;
    for (int i = 0; i < self->listener_count; i++) {
        if (self->listeners[i].active && 
            strcmp(self->listeners[i].event_name, event) == 0) {
            count++;
        }
    }
    return count;
}
