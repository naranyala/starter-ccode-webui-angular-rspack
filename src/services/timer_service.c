/* Timer Service Implementation - Timing and scheduling */

#include "services/timer_service.h"
#include "services/logger_service.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

static uint64_t get_time_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)(ts.tv_sec * 1000 + ts.tv_nsec / 1000000);
}

DI_SERVICE_INIT(TimerService, timer_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    self->timer_count = 0;
    self->start_time_ms = get_time_ms();
    memset(self->timers, 0, sizeof(self->timers));
    
    return DI_OK;
}

DI_SERVICE_CLEANUP(TimerService, timer_service) {
    if (!self) return;
    self->timer_count = 0;
}

DI_DEFINE_SERVICE(TimerService, timer_service)

int timer_set_timeout(TimerService* self, uint64_t delay_ms, TimerCallback callback, void* user_data) {
    if (!self || !callback) return -1;
    if (self->timer_count >= TIMER_MAX_TIMERS) {
        fprintf(stderr, "TimerService: Max timers reached\n");
        return -1;
    }
    
    Timer* timer = &self->timers[self->timer_count];
    timer->id = self->timer_count;
    timer->active = 1;
    timer->interval_ms = delay_ms;
    timer->next_trigger_ms = get_time_ms() + delay_ms;
    timer->callback = callback;
    timer->user_data = user_data;
    timer->repeat = 0;
    
    self->timer_count++;
    return timer->id;
}

int timer_set_interval(TimerService* self, uint64_t interval_ms, TimerCallback callback, void* user_data) {
    if (!self || !callback) return -1;
    if (self->timer_count >= TIMER_MAX_TIMERS) {
        fprintf(stderr, "TimerService: Max timers reached\n");
        return -1;
    }
    
    Timer* timer = &self->timers[self->timer_count];
    timer->id = self->timer_count;
    timer->active = 1;
    timer->interval_ms = interval_ms;
    timer->next_trigger_ms = get_time_ms() + interval_ms;
    timer->callback = callback;
    timer->user_data = user_data;
    timer->repeat = 1;
    
    self->timer_count++;
    return timer->id;
}

void timer_clear(TimerService* self, int timer_id) {
    if (!self || timer_id < 0 || timer_id >= self->timer_count) return;
    
    self->timers[timer_id].active = 0;
}

void timer_update(TimerService* self) {
    if (!self) return;
    
    uint64_t now = get_time_ms();
    
    for (int i = 0; i < self->timer_count; i++) {
        Timer* timer = &self->timers[i];
        if (!timer->active) continue;
        
        if (now >= timer->next_trigger_ms) {
            /* Execute callback */
            timer->callback(timer->user_data);
            
            if (timer->repeat) {
                timer->next_trigger_ms = now + timer->interval_ms;
            } else {
                timer->active = 0;
            }
        }
    }
}

int timer_get_active_count(TimerService* self) {
    if (!self) return 0;
    
    int count = 0;
    for (int i = 0; i < self->timer_count; i++) {
        if (self->timers[i].active) count++;
    }
    return count;
}
