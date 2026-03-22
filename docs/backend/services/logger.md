# LoggerService

Logging service with timestamps and log levels.

## Overview

LoggerService provides application-wide logging functionality with:

- Timestamp support
- Multiple log levels (INFO, DEBUG, WARN, ERROR)
- Configurable output destination
- Thread-safe operation

## API Reference

### Types

```c
typedef struct LoggerService {
    DI_Service base;
    const char* prefix;
    bool debug_enabled;
    FILE* output;
} LoggerService;
```

### Functions

```c
// Log a message
void logger_log(LoggerService* self, const char* level, const char* format, ...);

// Enable/disable debug mode
void logger_set_debug(LoggerService* self, bool enabled);
```

## Usage

### Basic Logging

```c
LoggerService* logger = logger_service_inject();

logger_log(logger, "INFO", "Application started");
logger_log(logger, "DEBUG", "Debug value: %d", value);
logger_log(logger, "WARN", "Warning message");
logger_log(logger, "ERROR", "Error occurred: %s", error_msg);
```

### Enable Debug Mode

```c
logger_set_debug(logger, true);
logger_log(logger, "DEBUG", "This will now be visible");
```

## Output Format

```
[2024-01-15 10:30:45] [INFO] Application started
[2024-01-15 10:30:46] [DEBUG] Debug value: 42
[2024-01-15 10:30:47] [WARN] Warning message
[2024-01-15 10:30:48] [ERROR] Error occurred: File not found
```

## Dependencies

None (foundation service)

## Related Services

- ConfigService - Can configure log level
- FileService - Can log to file

## Example

```c
#include "services/logger_service.h"

int main(void) {
    app_module_init();
    
    LoggerService* logger = logger_service_inject();
    logger_set_debug(logger, true);
    
    logger_log(logger, "INFO", "Starting application...");
    
    // Application logic...
    
    logger_log(logger, "INFO", "Application finished");
    app_module_destroy();
    return 0;
}
```
