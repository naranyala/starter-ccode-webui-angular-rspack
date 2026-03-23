# Timer Service

Timing and scheduling utilities.

## Overview

TimerService provides timing functionality for periodic tasks and delays.

## API

### Timer Management

| Function | Description |
|----------|-------------|
| `timer_service_inject()` | Get timer service instance |
| `timer_start(TimerService*, interval_ms, callback, user_data)` | Start periodic timer |
| `timer_stop(TimerService*, timer_id)` | Stop timer |
| `timer_is_running(TimerService*, timer_id)` | Check if running |

### Utility Functions

| Function | Description |
|----------|-------------|
| `timer_sleep(int ms)` | Sleep for milliseconds |
| `timer_now()` | Get current time in ms |
| `timer_elapsed(start_time)` | Get elapsed time |

### Callback Signature

```c
typedef void (*TimerCallback)(int timer_id, void* user_data);
```

## Usage

```c
#include "services/timer_service.h"

// Get service
TimerService* timer = timer_service_inject();

// Define callback
void on_tick(int id, void* data) {
    printf("Timer tick: %d\n", id);
}

// Start periodic timer (every 1000ms)
int timer_id = timer_start(timer, 1000, on_tick, NULL);

// Stop timer
timer_stop(timer, timer_id);

// One-time delay
timer_sleep(500);  // Sleep 500ms

// Measure elapsed time
long start = timer_now();
// ... do work ...
long elapsed = timer_elapsed(start);
printf("Elapsed: %ldms\n", elapsed);
```

## Timer ID

Timers return an ID for management:

```c
int id1 = timer_start(timer, 1000, callback1, NULL);
int id2 = timer_start(timer, 2000, callback2, NULL);

// Stop specific timer
timer_stop(timer, id1);

// Check if running
if (timer_is_running(timer, id2)) {
    // Timer is active
}
```

## Related Documentation

- [Event Service](event.md) - Event publishing
