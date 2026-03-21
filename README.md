# C Project with nob.h Build System & WebUI + Angular Frontend

A full-stack C project using [nob.h](https://github.com/tsoding/nob.h) as the build pipeline, [WebUI](https://github.com/webui-dev/webui) for the backend, and an [Angular](https://angular.dev/) frontend.

## Project Structure

```
.
├── nob.h                    # Build system header (v3.7.0)
├── build.c                  # Build script with multiple commands
├── run.sh                   # Wrapper script
├── frontend/                # Angular frontend application
│   ├── src/                 # Frontend source code
│   ├── dist/                # Built frontend (generated)
│   └── package.json         # Frontend dependencies
├── src/                     # Backend C source code
│   ├── di/                  # Dependency Injection system
│   │   ├── di.h             # DI header
│   │   ├── di.c             # DI implementation
│   │   └── README.md        # DI documentation
│   ├── services/            # DI Services
│   │   ├── logger_service.h/c   # Logging service
│   │   ├── config_service.h/c   # Config service
│   │   └── webui_service.h/c    # WebUI service
│   ├── app_module.h         # Service registration (NgModule-like)
│   └── main.c               # Application entry point
├── thirdparty/
│   └── webui/               # WebUI library
│       ├── include/         # Headers
│       └── src/             # Source files
├── build/                   # Output directory (generated)
│   ├── main                 # Compiled binary
│   └── libwebui-2.a         # WebUI static library
└── README.md                # This file
```

## Quick Start

### Prerequisites

- GCC compiler
- [Bun](https://bun.sh/) (for frontend builds)

### Install dependencies (first time only)

The build script automatically installs frontend dependencies if `frontend/node_modules` is missing.
You can also pre-install manually:

```bash
cd frontend && bun install && cd ..
```

### Show help

```bash
./run.sh
```

### Build and run the application

```bash
./run.sh dev
```

This will:
1. Build the Angular frontend (`frontend/dist/browser/`)
2. Build the WebUI static library
3. Compile the C backend
4. Start the web server and open your browser

### Clean build artifacts

```bash
./run.sh clean
```

### Rebuild from scratch

```bash
./run.sh rebuild
```

## Build Commands

| Command | Description |
|---------|-------------|
| `./run.sh` | Show help (default) |
| `./run.sh build` | Build the project only (no run) |
| `./run.sh dev` | Build and run the application |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh run` | Build and run the application |
| `./run.sh rebuild` | Clean and rebuild |
| `./run.sh help` | Show help message |

## Build Configuration

### Warning Levels

- **Our code** (`build.c`, `main.c`): Compiled with `-Wall -Wextra -Werror` (strict)
- **Third-party code** (WebUI, CivetWeb): Compiled with relaxed warnings to suppress unused variable warnings in the library

This ensures our code is warning-free while allowing third-party libraries to compile without noise.

## How It Works

## Backend (C + WebUI + DI)

The C backend uses:
1. **WebUI** - Native WebView window embedding
2. **DI System** - Angular-inspired dependency injection
3. **CivetWeb** - Embedded web server

### Dependency Injection

The backend features a type-safe DI system inspired by Angular:

```c
// Service definition
typedef struct {
    DI_Service base;
    LoggerService* logger;  // Dependency
} ConfigService;

// Constructor injection (similar to Angular)
DI_SERVICE_INIT(ConfigService, config_service) {
    self->logger = logger_service_inject();  // Like inject()
    return DI_OK;
}

// Usage
ConfigService* config = config_service_inject();
```

See [src/di/README.md](src/di/README.md) for full documentation.

### Services

| Service | Description | Scope | Dependencies |
|---------|-------------|-------|--------------|
| `LoggerService` | Logging with timestamps and levels | Singleton | None |
| `EventService` | Pub/sub event bus for decoupled communication | Singleton | None |
| `FileService` | File system operations (read, write, copy, delete) | Singleton | None |
| `TimerService` | Timing and scheduling (timeout, interval) | Singleton | None |
| `ConfigService` | Application configuration | Singleton | LoggerService |
| `WebuiService` | WebUI window management | Singleton | LoggerService, ConfigService |

### Service Dependencies

```
LoggerService (foundation)
EventService  (foundation)
FileService   (foundation)
TimerService  (foundation)
     ↓
ConfigService (depends on LoggerService)
     ↓
WebuiService  (depends on LoggerService, ConfigService)
```

### Service Registration

Services are registered in `app_module.h` similar to Angular's `NgModule`:

```c
static inline int app_module_init(void) {
    // Register in dependency order
    DI_REGISTER_SINGLETON(LoggerService, logger_service);
    DI_REGISTER_SINGLETON(ConfigService, config_service);
    DI_REGISTER_SINGLETON(WebuiService, webui_service);
    return 0;
}
```

## Frontend Features

### Design Philosophy
- **Minimalist**: Removed unnecessary UI elements, stats, and clutter
- **Clean**: Focused on content with simple navigation
- **Responsive**: Seamless experience across desktop and mobile

### Desktop Mode (>768px)
- **Collapsible Sidebar**: Left navigation with icons and labels
- **Toggle**: Press `Ctrl/Cmd + B` to collapse/expand sidebar
- **Main Content**: Centered, readable layout with card grids
- **Two Menu Groups**: Main (Home, Auth, SQLite, DevTools) and Support (Settings, Help, About)

### Mobile Mode (≤768px)
- **Mobile Header**: Fixed top bar with menu toggle and page title
- **Slide-in Menu**: Left panel with full navigation
- **Overlay Backdrop**: Tap to close menu
- **Escape Key**: Closes mobile menu
- **Single Column Cards**: Optimized for small screens

### Removed Elements
- ❌ Stats section (menu counts)
- ❌ Search functionality (unused)
- ❌ Third panel selector (Details/Activity)
- ❌ Footer actions (expand/collapse, info buttons)
- ❌ Resizable splitters (complex for minimal gain)
- ❌ Duplicate content sections

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Toggle sidebar collapse |
| `Escape` | Close mobile menu |

The Angular frontend:
1. Builds to `frontend/dist/browser/`
2. Is served by the C backend's embedded web server
3. Is displayed in a native WebView window (WebKit on Linux, WebView2 on Windows, WebKit on macOS)
4. Can communicate with the backend via bound functions

### Communication Example

**Backend (C):**
```c
void on_frontend_event(webui_event_t* e) {
    const char* data = webui_get_string_at(e, 1);
    printf("Frontend sent: %s\n", data);
}

webui_bind(my_window, "backend_event", on_frontend_event);
```

**Frontend (TypeScript):**
```typescript
// Call backend function
window.backend_event('Hello from Angular!');
```

## Auto-Rebuild Feature

The build script uses `NOB_GO_REBUILD_URSELF` which automatically recompiles itself when you modify `build.c` or `nob.h`. This means you can edit the build script and just run it again - it will rebuild itself first!

## Development Workflow

1. **Frontend changes**: Edit files in `frontend/src/`, then run `./run.sh dev`
2. **Backend changes**: Edit `main.c`, then run `./run.sh dev`
3. **Build script changes**: Edit `build.c`, it auto-rebuilds on next run

## WebUI Resources

- [WebUI GitHub](https://github.com/webui-dev/webui)
- [WebUI Documentation](https://webui.me/docs/)
- [WebUI Examples](https://github.com/webui-dev/webui/tree/main/examples)

## License

- **nob.h** - Public Domain
- **WebUI** - MIT License
- **Angular** - MIT License
- **Your code** - Your choice
