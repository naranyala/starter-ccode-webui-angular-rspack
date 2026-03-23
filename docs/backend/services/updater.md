# Updater Service

Auto-updater with background downloads and verification.

## Overview

UpdaterService provides application updates with download, verification, and installation.

## API

### Update Operations

| Function | Description |
|----------|-------------|
| `updater_service_inject()` | Get updater service instance |
| `updater_check(UpdaterService*, url)` | Check for updates |
| `updater_download(UpdaterService*, url)` | Download update |
| `updater_verify(UpdaterService*, checksum)` | Verify checksum |
| `updater_install(UpdaterService*)` | Install update |

### Progress Callbacks

```c
typedef void (*UpdateProgressCallback)(int percent, void* user_data);
typedef void (*UpdateCompleteCallback)(bool success, void* user_data);
```

## Usage

```c
#include "services/updater_service.h"

// Get service
UpdaterService* updater = updater_service_inject();

// Progress callback
void on_progress(int percent, void* data) {
    printf("Download: %d%%\n", percent);
}

// Check for updates
UpdateInfo* info = updater_check(updater, "https://updates.example.com/latest");
if (info && info->available) {
    printf("New version: %s\n", info->version);
    
    // Download
    updater_download(updater, info->url);
    
    // Verify
    if (updater_verify(updater, info->checksum)) {
        // Install
        updater_install(updater);
    }
}
```

## Related Documentation

- [HTTP Service](http.md) - Update downloads
