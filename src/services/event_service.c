/**
 * @file event_service.c
 * @brief Event service implementation - Pub/Sub event bus
 */

#include "services/event_service.h"
#include "services/logger_service.h"
#include <string.h>
#include <stdio.h>

/* ============================================================================
 * DI Service Implementation
 * ============================================================================ */

DI_SERVICE_INIT(EventService, event_service) {
    VALIDATE_PTR(self, DI_ERROR_NULL_POINTER);

    self->listener_count = 0;
    memset(self->listeners, 0, sizeof(self->listeners));

    LoggerService* logger = logger_service_inject();
    LOG_DEBUG(logger, "EventService initialized");

    return DI_OK;
}

DI_SERVICE_CLEANUP(EventService, event_service) {
    if (!self) return;
    self->listener_count = 0;
}

DI_DEFINE_SERVICE(EventService, event_service)

/* ============================================================================
 * Public API Implementation
 * ============================================================================ */

ServiceResult event_subscribe(EventService* self, const char* event, 
                              EventHandler handler, void* user_data) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(event, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_PTR(handler, RESULT_ERROR_INVALID_PARAM);

    if (self->listener_count >= EVENT_MAX_HANDLERS) {
        return RESULT_ERROR_ALREADY_EXISTS;
    }

    EventListener* listener = &self->listeners[self->listener_count];
    STR_SAFE_COPY(listener->event_name, event, EVENT_MAX_NAME_LENGTH);
    listener->handler = handler;
    listener->user_data = user_data;
    listener->active = 1;

    self->listener_count++;

    LoggerService* logger = logger_service_inject();
    LOG_DEBUG(logger, "Subscribed to event: %s", event);

    return RESULT_OK;
}

ServiceResult event_unsubscribe(EventService* self, const char* event, 
                                EventHandler handler) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(event, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_PTR(handler, RESULT_ERROR_INVALID_PARAM);

    for (int i = 0; i < self->listener_count; i++) {
        EventListener* listener = &self->listeners[i];
        if (listener->active &&
            strcmp(listener->event_name, event) == 0 &&
            listener->handler == handler) {
            listener->active = 0;

            LoggerService* logger = logger_service_inject();
            LOG_DEBUG(logger, "Unsubscribed from event: %s", event);

            return RESULT_OK;
        }
    }

    return RESULT_ERROR_NOT_FOUND;
}

ServiceResult event_emit(EventService* self, const char* event, const char* payload) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(event, RESULT_ERROR_INVALID_PARAM);

    if (self->listener_count == 0) {
        return RESULT_OK; /* No listeners, but not an error */
    }

    int notified = 0;
    for (int i = 0; i < self->listener_count; i++) {
        EventListener* listener = &self->listeners[i];
        if (listener->active && strcmp(listener->event_name, event) == 0) {
            listener->handler(event, payload ? payload : "", listener->user_data);
            notified++;
        }
    }

    LoggerService* logger = logger_service_inject();
    LOG_DEBUG(logger, "Emitted event: %s (notified %d listeners)", event, notified);

    return RESULT_OK;
}

ServiceResult event_clear_all(EventService* self) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);

    memset(self->listeners, 0, sizeof(self->listeners));
    self->listener_count = 0;

    LoggerService* logger = logger_service_inject();
    LOG_INFO(logger, "Cleared all event listeners");

    return RESULT_OK;
}

int event_get_listener_count(EventService* self, const char* event) {
    VALIDATE_PTR(self, 0);
    VALIDATE_STR(event, 0);

    int count = 0;
    for (int i = 0; i < self->listener_count; i++) {
        if (self->listeners[i].active &&
            strcmp(self->listeners[i].event_name, event) == 0) {
            count++;
        }
    }
    return count;
}
