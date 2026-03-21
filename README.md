# C + Angular WebUI Project

A full-stack desktop application with a C backend using WebUI for native windows and an Angular frontend.

## 📁 Project Structure

```
.
├── 📄 nob.h                          # Build system header (nob.h v3.7.0)
├── 📄 build.c                        # Build script with multiple commands
├── 📄 run.sh                         # Wrapper script for build commands
├── 📄 .gitignore                     # Git ignore rules
├── 📄 README.md                      # This file
│
├── 📂 src/                           # Backend C source code
│   ├── 📄 main.c                     # Application entry point
│   ├── 📄 app_module.h               # Service registration (NgModule-like)
│   │
│   ├── 📂 di/                        # Dependency Injection System (stb-style)
│   │   ├── 📄 di.h                   # Single header DI library
│   │   ├── 📄 di_impl.c              # DI implementation
│   │   └── 📄 README.md              # DI documentation
│   │
│   └── 📂 services/                  # DI Services
│       ├── 📄 logger_service.h/c     # Logging with timestamps
│       ├── 📄 config_service.h/c     # Application configuration
│       ├── 📄 webui_service.h/c      # WebUI window management
│       ├── 📄 event_service.h/c      # Pub/sub event bus
│       ├── 📄 file_service.h/c       # File system operations
│       └── 📄 timer_service.h/c      # Timing and scheduling
│
├── 📂 frontend/                      # Angular frontend application
│   ├── 📄 package.json               # Node.js dependencies
│   ├── 📄 bun.lock                   # Bun lockfile
│   ├── 📄 bunfig.toml                # Bun configuration
│   ├── 📄 biome.json                 # Biome linter config
│   ├── 📄 tsconfig.json              # TypeScript config
│   ├── 📄 rspack.config.js           # Rspack bundler config
│   ├── 📄 angular.json               # Angular CLI config
│   ├── 📄 README.md                  # Frontend documentation
│   │
│   ├── 📂 src/                       # Frontend source
│   │   ├── 📄 main.ts                # Frontend entry point
│   │   ├── 📄 index.html             # HTML template
│   │   ├── 📄 styles.css             # Global styles
│   │   ├── 📄 winbox-loader.ts       # WinBox window loader
│   │   │
│   │   ├── 📂 views/                 # View components
│   │   │   ├── 📄 app.component.html/ts/css  # Main app component
│   │   │   ├── 📂 home/              # Home view
│   │   │   ├── 📂 auth/              # Authentication view
│   │   │   ├── 📂 sqlite/            # SQLite CRUD view
│   │   │   ├── 📂 devtools/          # DevTools view
│   │   │   └── 📂 shared/            # Shared components
│   │   │
│   │   ├── 📂 core/                  # Core services
│   │   │   ├── 📄 api.service.ts     # API communication
│   │   │   ├── 📄 http.service.ts    # HTTP client
│   │   │   ├── 📄 logger.service.ts  # Logging service
│   │   │   ├── 📄 theme.service.ts   # Theme management
│   │   │   ├── 📄 winbox.service.ts  # WinBox window manager
│   │   │   ├── 📄 webui/             # WebUI integration
│   │   │   └── 📄 *.test.ts          # Service tests
│   │   │
│   │   ├── 📂 models/                # TypeScript models
│   │   │   ├── 📄 card.model.ts      # Card data model
│   │   │   ├── 📄 log.model.ts       # Log entry model
│   │   │   ├── 📄 window.model.ts    # Window model
│   │   │   └── 📄 index.ts           # Barrel export
│   │   │
│   │   ├── 📂 types/                 # TypeScript types
│   │   │   ├── 📄 error.types.ts     # Error types
│   │   │   ├── 📄 winbox.d.ts        # WinBox type definitions
│   │   │   └── 📄 index.ts           # Barrel export
│   │   │
│   │   ├── 📂 environments/          # Environment configs
│   │   │   └── 📄 environment.ts     # Environment variables
│   │   │
│   │   └── 📂 integration/           # Integration tests
│   │       └── 📄 *.test.ts          # Integration test files
│   │
│   ├── 📂 dist/                      # Built output (generated)
│   │   └── 📂 browser/               # Browser build
│   │       ├── 📄 index.html         # Built HTML
│   │       ├── 📄 main-*.js          # Bundled JavaScript
│   │       ├── 📄 styles-*.css       # Bundled CSS
│   │       └── 📄 polyfills-*.js     # Polyfills
│   │
│   └── 📂 docs/                      # Documentation
│       ├── 📄 00-README.md           # Docs index
│       └── 📄 01-DI_EVALUATION.md    # DI system evaluation
│
├── 📂 thirdparty/                    # Third-party libraries
│   └── 📂 webui/                     # WebUI library
│       ├── 📂 include/               # WebUI headers
│       │   ├── 📄 webui.h            # WebUI C header
│       │   └── 📄 webui.hpp          # WebUI C++ header
│       │
│       ├── 📂 src/                   # WebUI source
│       │   ├── 📄 webui.c            # WebUI implementation
│       │   └── 📂 civetweb/          # CivetWeb embedded server
│       │
│       ├── 📂 examples/              # WebUI examples
│       │   ├── 📂 C/                 # C examples
│       │   └── 📂 C++/               # C++ examples
│       │
│       └── 📂 bridge/                # WebUI bridge utilities
│
└── 📂 build/                         # Build output (generated)
    ├── 📄 main                       # Compiled binary
    ├── 📄 libwebui-2.a               # WebUI static library
    ├── 📄 webui.o                    # WebUI object file
    └── 📄 civetweb.o                 # CivetWeb object file
```

## 🚀 Quick Start

### Prerequisites

- GCC compiler
- [Bun](https://bun.sh/) (for frontend builds)

### Build Commands

```bash
# Show help
./run.sh

# Build and run (default)
./run.sh dev

# Build only (no run)
./run.sh build

# Clean build artifacts
./run.sh clean

# Clean and rebuild
./run.sh rebuild
```

## 🏗️ Architecture

### Backend (C + DI System + WebUI)

```
src/
├── main.c              → Entry point, DI initialization
├── app_module.h        → Service registration
├── di/                 → Dependency Injection (stb-style)
│   ├── di.h           → Single header library
│   └── di_impl.c      → Implementation
└── services/          → Application services
    ├── logger_service → Logging
    ├── event_service  → Pub/Sub events
    ├── file_service   → File operations
    ├── timer_service  → Timing/scheduling
    ├── config_service → Configuration
    └── webui_service  → WebUI wrapper
```

**Service Dependencies:**
```
LoggerService ─┬─→ ConfigService ─→ WebuiService
EventService   │
FileService    │
TimerService ──┘
```

### Frontend (Angular + Rspack)

```
frontend/src/
├── main.ts            → Bootstrap
├── index.html         → Entry HTML
├── views/             → Components
│   ├── app.component  → Root component
│   ├── home/          → Home view
│   ├── auth/          → Auth view
│   ├── sqlite/        → Database view
│   └── devtools/      → DevTools view
├── core/              → Services
│   ├── api.service    → Backend API
│   ├── logger.service → Logging
│   ├── theme.service  → Theming
│   └── winbox.service → Window management
├── models/            → Data models
└── types/             → TypeScript types
```

## 📦 Build Pipeline

### nob.h Build System

The project uses [nob.h](https://github.com/tsoding/nob.h) v3.7.0, a single-header C build library.

**Build Flow:**
```
build.c (build script)
    ↓
nob.h (build library)
    ↓
1. Build Angular frontend → frontend/dist/browser/
2. Build WebUI static lib → build/libwebui-2.a
3. Compile C backend    → build/main
4. Launch application
```

### Build Commands (build.c)

| Command | Description |
|---------|-------------|
| `dev` | Build frontend + backend + run |
| `build` | Build only |
| `clean` | Remove build artifacts |
| `run` | Build and run |
| `rebuild` | Clean + build + run |
| `help` | Show help |

## 🔧 Dependency Injection System

The backend features an **stb-style single-header DI system** inspired by Angular:

```c
// 1. Define service (header)
typedef struct {
    DI_Service base;
    LoggerService* logger;
} ConfigService;

DI_DECLARE_SERVICE(ConfigService, config_service);

// 2. Implement (source)
DI_SERVICE_INIT(ConfigService, config_service) {
    self->logger = logger_service_inject();  // Inject dependency
    return DI_OK;
}

DI_DEFINE_SERVICE(ConfigService, config_service)

// 3. Use
ConfigService* config = config_service_inject();
```

See [src/di/README.md](src/di/README.md) for full documentation.

## 🎨 Frontend Features

### Desktop Mode (>768px)
- Collapsible sidebar navigation
- Centered content with card grids
- Keyboard shortcuts (`Ctrl/Cmd + B` to toggle sidebar)

### Mobile Mode (≤768px)
- Mobile header with menu toggle
- Slide-in navigation panel
- Overlay backdrop
- Single-column card layout

### Services (Frontend)
| Service | Purpose |
|---------|---------|
| `ApiService` | Backend communication |
| `LoggerService` | Client-side logging |
| `ThemeService` | Dark/light theme |
| `WinBoxService` | Window management |
| `WebuiService` | WebUI backend bridge |

## 📊 Project Statistics

| Category | Count |
|----------|-------|
| Backend Services | 6 |
| Frontend Services | 12+ |
| View Components | 5 |
| Test Files | 15+ |
| Build Time (frontend) | ~15-20s |
| Build Time (backend) | ~2-3s |

## 📝 Documentation

- [README.md](README.md) - This file (project overview)
- [src/di/README.md](src/di/README.md) - DI system documentation
- [frontend/README.md](frontend/README.md) - Frontend documentation
- [frontend/docs/](frontend/docs/) - Additional frontend docs

## 🔑 Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Build** | nob.h | C build automation |
| **Build** | Bun | Frontend package manager |
| **Build** | Rspack | Frontend bundler |
| **Backend** | C (C99) | Application logic |
| **Backend** | DI System | Dependency injection |
| **Backend** | WebUI | Native WebView windows |
| **Backend** | CivetWeb | Embedded web server |
| **Frontend** | Angular v21 | UI framework |
| **Frontend** | TypeScript | Type-safe JavaScript |
| **Frontend** | WinBox | Window management |
| **Frontend** | Lucide Icons | Icon library |

## 📄 License

- **nob.h** - Public Domain
- **WebUI** - MIT License
- **Angular** - MIT License
- **Your code** - Your choice
