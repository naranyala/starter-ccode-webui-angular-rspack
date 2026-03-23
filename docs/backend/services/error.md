# Error Service

Centralized error tracking and reporting.

## Overview

ErrorService provides centralized error tracking with severity levels and file persistence.

## API

### Error Tracking

| Function | Description |
|----------|-------------|
| `error_service_inject()` | Get error service instance |
| `error_report(ErrorService*, level, category, message)` | Report error |
| `error_get_last(ErrorService*)` | Get last error |
| `error_clear(ErrorService*)` | Clear error history |

### Severity Levels

| Level | Value | Description |
|-------|-------|-------------|
| LOW | 0 | Minor issues |
| MEDIUM | 1 | Moderate issues |
| HIGH | 2 | Serious issues |
| CRITICAL | 3 | Critical failures |

## Usage

```c
#include "services/error_service.h"

// Get service
ErrorService* errors = error_service_inject();

// Report errors
error_report(errors, ERROR_LEVEL_MEDIUM, "database", "Connection timeout");
error_report(errors, ERROR_LEVEL_HIGH, "auth", "Invalid token");
error_report(errors, ERROR_LEVEL_CRITICAL, "system", "Out of memory");

// Get last error
ErrorInfo* last = error_get_last(errors);
if (last) {
    printf("Last error: %s [%s]\n", last->message, last->category);
}
```

## Related Documentation

- [Logger Service](logger.md) - Error logging
