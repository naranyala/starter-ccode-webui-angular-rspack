# C Project with nob.h Build System & WebUI

A minimal C project setup using [nob.h](https://github.com/tsoding/nob.h) as the build pipeline with [WebUI](https://github.com/webui-dev/webui) for embedded web interfaces.

## Quick Start

### Show help

```bash
./run.sh
```

### Build and run the application

```bash
./run.sh dev

# Or directly
gcc -o build_runner build.c && ./build_runner dev
```

### Clean build artifacts

```bash
./run.sh clean
```

### Rebuild from scratch

```bash
./run.sh rebuild
```

## Project Structure

```
.
├── nob.h                    # Build system header (v3.7.0)
├── build.c                  # Build script with multiple commands
├── run.sh                   # Wrapper script
├── main.c                   # Main source file (WebUI example)
├── thirdparty/
│   └── webui/               # WebUI library
│       ├── include/         # Headers
│       └── src/             # Source files
├── build/                   # Output directory (created by build)
│   ├── main                 # Compiled binary
│   ├── libwebui-2.a         # WebUI static library
│   ├── webui.o              # WebUI object file
│   └── civetweb.o           # CivetWeb object file
└── README.md                # This file
```

## Build Commands

| Command | Description |
|---------|-------------|
| `./run.sh` | Show help (default) |
| `./run.sh dev` | Build and run the application |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh run` | Build and run the application |
| `./run.sh rebuild` | Clean and rebuild |
| `./run.sh help` | Show help message |

## WebUI Integration

The build script compiles:
1. **CivetWeb** - Embedded web server used by WebUI
2. **WebUI** - Library for embedding web interfaces in C apps
3. **Your application** - Linked against the WebUI static library

### Example: Binding JavaScript to C

```c
// HTML with JavaScript function
const char* html = 
    "<button onclick=\"my_function('Hello')\">Click</button>";

// C callback handler
void my_function(webui_event_t* e) {
    const char* arg = webui_get_string_at(e, 1);
    printf("JS called with: %s\n", arg);
}

// In main():
webui_bind(my_window, "my_function", my_function);
webui_show(my_window, html);
webui_wait();
```

## Auto-Rebuild Feature

The build script uses `NOB_GO_REBUILD_URSELF` which automatically recompiles itself when you modify `build.c` or `nob.h`. This means you can edit the build script and just run it again - it will rebuild itself first!

## Customizing the Build

Edit `build.c` to:
- Add more source files
- Change compiler flags
- Add additional build targets

Example with multiple source files:

```c
static bool build_main(void)
{
    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd,
        "gcc", "-Wall", "-Wextra", "-g",
        "-o", "build/main",
        "main.c", "utils.c", "handlers.c",
        "-I./thirdparty/webui/include/",
        "-L./build", "-lwebui-2",
        "-lpthread", "-ldl"
    );
    return nob_cmd_run(&cmd);
}
```

## WebUI Resources

- [WebUI GitHub](https://github.com/webui-dev/webui)
- [WebUI Documentation](https://webui.me/docs/)
- [WebUI Examples](https://github.com/webui-dev/webui/tree/main/examples)

## License

- **nob.h** - Public Domain
- **WebUI** - MIT License
- **Your code** - Your choice
