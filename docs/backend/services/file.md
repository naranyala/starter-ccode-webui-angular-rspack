# File Service

File system operations.

## Overview

FileService provides cross-platform file system operations.

## API

### File Operations

| Function | Description |
|----------|-------------|
| `file_exists(const char* path)` | Check if file exists |
| `file_read(const char* path)` | Read file contents |
| `file_write(const char* path, const char* content)` | Write file |
| `file_delete(const char* path)` | Delete file |
| `file_copy(const char* src, const char* dest)` | Copy file |

### Directory Operations

| Function | Description |
|----------|-------------|
| `dir_exists(const char* path)` | Check if directory exists |
| `dir_create(const char* path)` | Create directory |
| `dir_delete(const char* path)` | Delete directory |
| `dir_list(const char* path)` | List directory contents |

### Path Utilities

| Function | Description |
|----------|-------------|
| `path_join(const char* base, const char* name)` | Join path components |
| `path_dirname(const char* path)` | Get directory name |
| `path_basename(const char* path)` | Get file name |
| `path_extension(const char* path)` | Get file extension |

## Usage

```c
#include "services/file_service.h"

// Check existence
if (file_exists("config.json")) {
    // Read file
    char* content = file_read("config.json");
    if (content) {
        printf("Content: %s\n", content);
        free(content);
    }
}

// Write file
file_write("output.txt", "Hello, World!");

// Directory operations
if (!dir_exists("logs")) {
    dir_create("logs");
}

// List directory
const char** files = dir_list(".");
for (int i = 0; files[i]; i++) {
    printf("File: %s\n", files[i]);
}
```

## Path Handling

```c
// Join paths (cross-platform)
char* path = path_join("/home/user", "file.txt");

// Get components
const char* dir = path_dirname("/home/user/file.txt");  // "/home/user"
const char* base = path_basename("/home/user/file.txt"); // "file.txt"
const char* ext = path_extension("/home/user/file.txt"); // ".txt"
```

## Related Documentation

- [Logger Service](logger.md) - Log file output
- [Config Service](config.md) - Config file loading
