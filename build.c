// build.c - Build pipeline for C project with WebUI
#define NOB_IMPLEMENTATION
#include "nob.h"

typedef enum {
    BUILD_CMD_NONE = 0,
    BUILD_CMD_BUILD,
    BUILD_CMD_DEV,
    BUILD_CMD_CLEAN,
    BUILD_CMD_EXECUTE,
    BUILD_CMD_REBUILD,
    BUILD_CMD_HELP,
} Build_Cmd;

static void print_help(const char *program)
{
    printf("Usage: %s [command]\n\n", program);
    printf("Commands:\n");
    printf("  build    - Build the project only\n");
    printf("  dev      - Build and run the application (default)\n");
    printf("  clean    - Remove build artifacts\n");
    printf("  run      - Build and run the application\n");
    printf("  rebuild  - Clean and rebuild\n");
    printf("  help     - Show this help message\n");
}

static bool build_frontend(void)
{
    nob_log(NOB_INFO, "Building Angular frontend...");
    
    // Check if node_modules exists, if not, install dependencies
    if (!nob_file_exists("frontend/node_modules")) {
        nob_log(NOB_INFO, "Frontend dependencies not found. Installing with bun...");
        
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "sh", "-c",
            "cd frontend && bun install",
            NULL
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            nob_log(NOB_ERROR, "Failed to install frontend dependencies");
            return false;
        }
        nob_cmd_free(cmd);
    }
    
    // Build the frontend
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "sh", "-c",
            "cd frontend && bun run build",
            NULL
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            nob_log(NOB_ERROR, "Failed to build frontend");
            return false;
        }
        nob_cmd_free(cmd);
    }
    
    return true;
}

static bool build_webui_lib(void)
{
    nob_log(NOB_INFO, "Building WebUI static library...");

    // Compile civetweb (with relaxed warnings for third-party code)
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "gcc",
            "-c",
            "-o", "build/civetweb.o",
            "-I./thirdparty/webui/include/",
            "-Wno-unused-parameter",
            "-Wno-unused-variable",
            "-Wno-unused-but-set-variable",
            "./thirdparty/webui/src/civetweb/civetweb.c",
            "-DNO_SSL", "-DNDEBUG", "-DNO_CACHING", "-DNO_CGI", "-DUSE_WEBSOCKET"
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            return false;
        }
        nob_cmd_free(cmd);
    }

    // Compile webui (with relaxed warnings for third-party code)
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "gcc",
            "-c",
            "-o", "build/webui.o",
            "-I./thirdparty/webui/include/",
            "-Wno-unused-parameter",
            "-Wno-unused-variable",
            "-Wno-unused-but-set-variable",
            "-Wno-unused-function",
            "./thirdparty/webui/src/webui.c",
            "-DNO_SSL"
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            return false;
        }
        nob_cmd_free(cmd);
    }

    // Create static library
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "ar", "rcs",
            "build/libwebui-2.a",
            "build/civetweb.o", "build/webui.o"
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            return false;
        }
        nob_cmd_free(cmd);
    }

    return true;
}

static bool build_main(void)
{
    nob_log(NOB_INFO, "Building main program with DI services...");

    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd,
        "gcc",
        "-Wall", "-Wextra", "-Werror", "-g",
        "-o", "build/main",
        "src/main.c",
        "src/services/logger_service.c",
        "src/services/config_service.c",
        "src/services/webui_service.c",
        "src/services/event_service.c",
        "src/services/file_service.c",
        "src/services/timer_service.c",
        "src/di/di_impl.c",
        "-I./src",
        "-I./thirdparty/webui/include/",
        "-L./build", "-lwebui-2",
        "-lpthread", "-ldl"
    );
    if (!nob_cmd_run(&cmd)) {
        nob_cmd_free(cmd);
        return false;
    }
    nob_cmd_free(cmd);

    return true;
}

static int do_build(void)
{
    nob_mkdir_if_not_exists("build");

    if (!build_frontend()) {
        nob_log(NOB_ERROR, "Failed to build frontend");
        return 1;
    }

    if (!build_webui_lib()) {
        nob_log(NOB_ERROR, "Failed to build WebUI library");
        return 1;
    }

    if (!build_main()) {
        nob_log(NOB_ERROR, "Failed to build main program");
        return 1;
    }

    nob_log(NOB_INFO, "Build completed!");
    return 0;
}

static int do_dev(void)
{
    nob_mkdir_if_not_exists("build");

    if (!build_frontend()) {
        nob_log(NOB_ERROR, "Failed to build frontend");
        return 1;
    }

    if (!build_webui_lib()) {
        nob_log(NOB_ERROR, "Failed to build WebUI library");
        return 1;
    }

    if (!build_main()) {
        nob_log(NOB_ERROR, "Failed to build main program");
        return 1;
    }

    nob_log(NOB_INFO, "Running application...");
    
    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd, "./build/main", NULL);
    if (!nob_cmd_run(&cmd)) {
        nob_cmd_free(cmd);
        return 1;
    }
    nob_cmd_free(cmd);

    return 0;
}

static int do_clean(void)
{
    nob_log(NOB_INFO, "Cleaning build artifacts...");

    // Remove individual files
    const char *files[] = {
        "build/main",
        "build/webui.o",
        "build/civetweb.o",
        "build/libwebui-2.a",
    };

    for (size_t i = 0; i < sizeof(files) / sizeof(files[0]); i++) {
        if (nob_file_exists(files[i])) {
            if (nob_delete_file(files[i])) {
                nob_log(NOB_INFO, "Deleted: %s", files[i]);
            }
        }
    }

    // Remove build directory using system command
    if (nob_file_exists("build")) {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd, "rm", "-rf", "build", NULL);
        nob_cmd_run(&cmd);
        nob_cmd_free(cmd);
        nob_log(NOB_INFO, "Deleted: build/");
    }

    // Clean frontend build (just log, not critical)
    nob_log(NOB_INFO, "Cleaning frontend build...");
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd, "sh", "-c", "cd frontend && rm -rf dist", NULL);
        nob_cmd_run(&cmd);
        nob_cmd_free(cmd);
    }

    nob_log(NOB_INFO, "Clean completed!");
    return 0;
}

static int do_run(void)
{
    nob_mkdir_if_not_exists("build");

    if (!build_webui_lib()) {
        nob_log(NOB_ERROR, "Failed to build WebUI library");
        return 1;
    }

    if (!build_main()) {
        nob_log(NOB_ERROR, "Failed to build main program");
        return 1;
    }

    nob_log(NOB_INFO, "Running application...");
    
    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd, "./build/main", NULL);
    if (!nob_cmd_run(&cmd)) {
        nob_cmd_free(cmd);
        return 1;
    }
    nob_cmd_free(cmd);

    return 0;
}

static int do_rebuild(void)
{
    do_clean();
    return do_dev();
}

int main(int argc, char **argv)
{
    NOB_GO_REBUILD_URSELF(argc, argv);

    Build_Cmd cmd = BUILD_CMD_DEV;  // default

    if (argc > 1) {
        if (strcmp(argv[1], "build") == 0) {
            cmd = BUILD_CMD_BUILD;
        } else if (strcmp(argv[1], "dev") == 0) {
            cmd = BUILD_CMD_DEV;
        } else if (strcmp(argv[1], "clean") == 0) {
            cmd = BUILD_CMD_CLEAN;
        } else if (strcmp(argv[1], "run") == 0) {
            cmd = BUILD_CMD_EXECUTE;
        } else if (strcmp(argv[1], "rebuild") == 0) {
            cmd = BUILD_CMD_REBUILD;
        } else if (strcmp(argv[1], "help") == 0 || strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            cmd = BUILD_CMD_HELP;
        } else {
            nob_log(NOB_ERROR, "Unknown command: %s", argv[1]);
            print_help(argv[0]);
            return 1;
        }
    }

    switch (cmd) {
        case BUILD_CMD_BUILD:
            return do_build();
        case BUILD_CMD_DEV:
            return do_dev();
        case BUILD_CMD_CLEAN:
            return do_clean();
        case BUILD_CMD_EXECUTE:
            return do_run();
        case BUILD_CMD_REBUILD:
            return do_rebuild();
        case BUILD_CMD_HELP:
            print_help(argv[0]);
            return 0;
        default:
            return do_dev();
    }
}
