/* Timer Service - Timing and scheduling utilities */

#ifndef TIMER_SERVICE_H
#define TIMER_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <stdint.h>

#define TIMER_MAX_TIMERS 32

typedef void (*TimerCallback)(void* user_data);

typedef struct Timer {
    int id;
    int active;
    uint64_t interval_ms;
    uint64_t next_trigger_ms;
    TimerCallback callback;
    void* user_data;
    int repeat;
} Timer;

typedef struct TimerService {
    DI_Service base;
    Timer timers[TIMER_MAX_TIMERS];
    int timer_count;
    uint64_t start_time_ms;
} TimerService;

DI_DECLARE_SERVICE(TimerService, timer_service);

/* Timer methods */
int timer_set_timeout(TimerService* self, uint64_t delay_ms, TimerCallback callback, void* user_data);
int timer_set_interval(TimerService* self, uint64_t interval_ms, TimerCallback callback, void* user_data);
void timer_clear(TimerService* self, int timer_id);
void timer_update(TimerService* self);
int timer_get_active_count(TimerService* self);

#endif /* TIMER_SERVICE_H */
