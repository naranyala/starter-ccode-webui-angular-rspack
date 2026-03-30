/**
 * @file event_service.h
 * @brief Pub/Sub event bus for decoupled service communication
 * 
 * Features:
 * - Publish/subscribe pattern for loose coupling
 * - Multiple handlers per event
 * - User data passthrough to handlers
 * 
 * @code
 * // Usage example:
 * EventService* events = INJECT_SERVICE(event_service);
 * 
 * // Subscribe to event
 * void on_user_login(const char* event, const char* payload, void* user_data) {
 *     printf("User logged in: %s\n", payload);
 * }
 * event_subscribe(events, "user.login", on_user_login, NULL);
 * 
 * // Emit event
 * event_emit(events, "user.login", "{\"id\": 123, \"email\": \"user@test.com\"}");
 * @endcode
 */

#ifndef EVENT_SERVICE_H
#define EVENT_SERVICE_H

#include "di/di.h"
#include "core/base_service.h"
#include "constants.h"
#include <stdbool.h>

typedef struct EventListener EventListener;
typedef void (*EventHandler)(const char* event, const char* payload, void* user_data);

/**
 * @brief Event listener structure
 */
typedef struct EventListener {
    char event_name[EVENT_MAX_NAME_LENGTH];   /**< Event name to listen for */
    EventHandler handler;                      /**< Callback function */
    void* user_data;                           /**< User data passed to handler */
    int active;                                /**< 1 if active, 0 if inactive */
} EventListener;

/**
 * @brief Event service instance
 */
typedef struct EventService {
    DI_Service base;                          /**< DI base structure */
    EventListener listeners[EVENT_MAX_HANDLERS]; /**< Listener array */
    int listener_count;                       /**< Number of registered listeners */
} EventService;

/* DI declarations */
DI_DECLARE_SERVICE(EventService, event_service);

/**
 * @brief Subscribe to an event
 * @param self EventService instance
 * @param event Event name to subscribe to
 * @param handler Callback function when event is emitted
 * @param user_data User data passed to handler
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult event_subscribe(EventService* self, const char* event, 
                              EventHandler handler, void* user_data);

/**
 * @brief Unsubscribe from an event
 * @param self EventService instance
 * @param event Event name to unsubscribe from
 * @param handler Handler function to remove
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult event_unsubscribe(EventService* self, const char* event, 
                                EventHandler handler);

/**
 * @brief Emit an event to all subscribers
 * @param self EventService instance
 * @param event Event name to emit
 * @param payload Event payload (JSON string recommended)
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult event_emit(EventService* self, const char* event, const char* payload);

/**
 * @brief Get number of listeners for an event
 * @param self EventService instance
 * @param event Event name to check
 * @return Number of listeners, or 0 on error
 */
int event_get_listener_count(EventService* self, const char* event);

/**
 * @brief Clear all event listeners
 * @param self EventService instance
 * @return RESULT_OK on success
 */
ServiceResult event_clear_all(EventService* self);

#endif /* EVENT_SERVICE_H */
