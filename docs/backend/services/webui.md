# WebUI Service

WebUI window management service.

## Overview

WebuiService provides window creation and management through the WebUI library, enabling native desktop windows with embedded web content.

## API

### Window Management

| Function | Description |
|----------|-------------|
| `webui_init_window(WebuiService*)` | Initialize and create window |
| `webui_show_content(WebuiService*, content)` | Show window with content |
| `webui_wait_window(WebuiService*)` | Wait for window close |
| `webui_cleanup_window(WebuiService*)` | Clean up window |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `window` | `size_t` | Window number |
| `initialized` | `bool` | Initialization state |
| `logger` | `LoggerService*` | Logger dependency |
| `config` | `ConfigService*` | Config dependency |

## Usage

```c
#include "services/webui_service.h"

// Get service
WebuiService* webui = webui_service_inject();

// Initialize window
if (!webui_init_window(webui)) {
    // Handle error
}

// Show frontend
webui_show_content(webui, "index.html");

// Wait for close
webui_wait_window(webui);

// Cleanup
webui_cleanup_window(webui);
```

## Frontend Path Resolution

The service automatically resolves the frontend path:

```c
// Resolution order:
// 1. Relative to executable: ../frontend/dist/browser
// 2. Current directory fallback
```

## Integration with CRUD API

```c
// Initialize database first
SQLiteService* sqlite = sqlite_service_inject();
sqlite_open(sqlite, "app.db");
sqlite_migrate(sqlite, migrations, count, -1);

// Initialize WebUI
WebuiService* webui = webui_service_inject();
webui_init_window(webui);

// Initialize CRUD handlers
crud_api_init(webui, sqlite);

// Show frontend
webui_show_content(webui, "index.html");
webui_wait_window(webui);
```

## WebUI Configuration

The service uses default WebUI configuration:

```c
// Window created with webui_new_window()
// Root folder set to frontend/dist/browser
// Web server started automatically
```

## Related Documentation

- [CRUD API](crud-api.md) - Database API handlers
- [WebUI Library](https://webui.me) - WebUI documentation
