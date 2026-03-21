# DI System - Single Header Dependency Injection for C

stb-style single header library.

## Quick Start

```c
// In your build, include di_impl.c:
// gcc main.c services.c src/di/di_impl.c -o app

// In your code:
#include "di/di.h"
```

## Project Structure

```
src/di/
├── di.h          # Single header (API + inline implementation)
├── di_impl.c     # Implementation for linking
└── README.md     # This file
```

## Usage Example

### 1. Define a Service (header)

```c
// logger_service.h
#ifndef LOGGER_SERVICE_H
#define LOGGER_SERVICE_H

#include "di/di.h"
#include <stdio.h>

typedef struct {
    DI_Service base;
    FILE* output;
} LoggerService;

DI_DECLARE_SERVICE(LoggerService, logger_service);
void logger_log(LoggerService* self, const char* msg);

#endif
```

### 2. Implement the Service

```c
// logger_service.c
#include "services/logger_service.h"

DI_SERVICE_INIT(LoggerService, logger_service) {
    self->output = stdout;
    return DI_OK;
}

DI_SERVICE_CLEANUP(LoggerService, logger_service) {
    // Cleanup
}

DI_DEFINE_SERVICE(LoggerService, logger_service)

void logger_log(LoggerService* self, const char* msg) {
    fprintf(self->output, "%s\n", msg);
}
```

### 3. Register Services (app_module.h)

```c
#ifndef APP_MODULE_H
#define APP_MODULE_H

#include <stdbool.h>
#include "di/di.h"

// Forward declarations
DI_Error logger_service_provider(DI_Container*, void**);
void logger_service_destroy(DI_Service*);

DI_Error config_service_provider(DI_Container*, void**);
void config_service_destroy(DI_Service*);

static inline int app_module_init(void) {
    // Register in dependency order
    DI_REGISTER_SINGLETON(logger_service);
    DI_REGISTER_SINGLETON(config_service);
    return 0;
}

static inline void app_module_destroy(void) {
    DI_Container_Destroy(DI_GetGlobalContainer());
}

#endif
```

### 4. Use Services (main.c)

```c
#include "app_module.h"
#include "services/logger_service.h"
#include "services/config_service.h"

int main(void) {
    if (app_module_init() != 0) return 1;
    
    // Inject services (Angular-style)
    LoggerService* logger = DI_INJECT(logger_service);
    ConfigService* config = DI_INJECT(config_service);
    
    logger_log(logger, "Application starting...");
    
    app_module_destroy();
    return 0;
}
```

## API Reference

### Macros

| Macro | Description |
|-------|-------------|
| `DI_DECLARE_SERVICE(Type, name)` | Declare service in header |
| `DI_DEFINE_SERVICE(Type, name)` | Define service provider |
| `DI_SERVICE_INIT(Type, name)` | Define initialization |
| `DI_SERVICE_CLEANUP(Type, name)` | Define cleanup |
| `DI_REGISTER_SINGLETON(name)` | Register singleton |
| `DI_REGISTER_TRANSIENT(name)` | Register transient |
| `DI_INJECT(name)` | Inject service |
| `DI_HAS(name)` | Check if registered |

## Example Services

The project includes several example services demonstrating the DI system:

### LoggerService
Logging with timestamps and severity levels.

### EventService
Pub/sub event bus for decoupled communication between services.

```c
// Subscribe to events
event_subscribe(events, "user.login", on_user_login, NULL);

// Emit events
event_emit(events, "user.login", "{\"user\": \"john\"}");
```

### FileService
File system operations wrapper.

```c
// Read file
char* content = file_read_text(files, "config.txt");

// Write file
file_write_text(files, "output.txt", "Hello, World!");

// Check existence
if (file_exists(files, "data.db")) { ... }
```

### TimerService
Timing and scheduling utilities.

```c
// One-time timeout
timer_set_timeout(timers, 5000, on_timeout, NULL);

// Repeating interval
timer_set_interval(timers, 1000, on_tick, NULL);

// Update timers (call in main loop)
timer_update(timers);
```

### Container Functions

| Function | Description |
|----------|-------------|
| `DI_Container_Init()` | Initialize container |
| `DI_Container_Destroy()` | Destroy and cleanup |
| `DI_Container_Register()` | Register provider |
| `DI_Container_Get()` | Get service |
| `DI_Container_Has()` | Check existence |
| `DI_GetGlobalContainer()` | Get global instance |
| `DI_Error_Message()` | Get error string |
