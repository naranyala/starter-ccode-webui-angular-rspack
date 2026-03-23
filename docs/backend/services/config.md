# Config Service

Application configuration management.

## Overview

ConfigService provides application configuration with support for JSON files and defaults.

## API

### Configuration Access

| Function | Description |
|----------|-------------|
| `config_service_inject()` | Get config service instance |
| `config_get_string(ConfigService*, key, default)` | Get string value |
| `config_get_int(ConfigService*, key, default)` | Get integer value |
| `config_get_bool(ConfigService*, key, default)` | Get boolean value |
| `config_set_string(ConfigService*, key, value)` | Set string value |
| `config_set_int(ConfigService*, key, value)` | Set integer value |
| `config_save(ConfigService*)` | Save to file |

### File Operations

| Function | Description |
|----------|-------------|
| `config_load_file(ConfigService*, path)` | Load from JSON file |
| `config_reset(ConfigService*)` | Reset to defaults |

## Usage

```c
#include "services/config_service.h"

// Get service
ConfigService* config = config_service_inject();

// Load configuration
config_load_file(config, "config.json");

// Get values with defaults
const char* name = config_get_string(config, "app.name", "MyApp");
int port = config_get_int(config, "server.port", 8080);
bool debug = config_get_bool(config, "debug", false);

// Set values
config_set_int(config, "server.port", 9090);
config_set_string(config, "app.version", "2.0");

// Save changes
config_save(config);
```

## Configuration File Format

```json
{
  "app": {
    "name": "My Application",
    "version": "1.0.0"
  },
  "server": {
    "port": 8080,
    "host": "localhost"
  },
  "database": {
    "path": "data.db"
  },
  "debug": false
}
```

## Related Documentation

- [JSON Service](json.md) - JSON parsing
- [File Service](file.md) - File operations
