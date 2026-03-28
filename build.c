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
    BUILD_CMD_TEST,
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
    printf("  test     - Run backend tests\n");
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
    
    // Build and copy webui.js to frontend dist
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "sh", "-c",
            "cd thirdparty/webui/bridge && "
            "[ -f node_modules/.bin/esbuild ] || npm install esbuild > /dev/null 2>&1 && "
            "./node_modules/.bin/esbuild --bundle --target=chrome90 --format=esm --tree-shaking=false --outdir=. ./webui.ts 2>/dev/null && "
            "cp webui.js ../../..",
            NULL
        );
        if (!nob_cmd_run(&cmd)) {
            nob_log(NOB_WARNING, "webui.js build failed");
        }
        nob_cmd_free(cmd);
    }
    
    // Copy webui.js to frontend dist
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd, "cp", "thirdparty/webui/bridge/webui.js", "frontend/dist/browser/", NULL);
        nob_cmd_run(&cmd);
        nob_cmd_free(cmd);
    }
    
    // Patch index.html to include webui.js as a module
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "sh", "-c",
            "if [ -f frontend/dist/browser/webui.js ] && [ -f frontend/dist/browser/index.html ]; then "
            "sed -i 's|<script src=\"polyfills|<script src=\"webui.js\" type=\"module\"></script><script src=\"polyfills|' frontend/dist/browser/index.html; "
            "echo 'Patched index.html with webui.js'; fi",
            NULL
        );
        if (!nob_cmd_run(&cmd)) {
            nob_log(NOB_WARNING, "Failed to patch index.html");
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

    // Compile SQLite amalgamation
    {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "gcc",
            "-c",
            "-o", "build/sqlite3.o",
            "-I./thirdparty/sqlite-amalgamation-3510300/",
            "./thirdparty/sqlite-amalgamation-3510300/sqlite3.c"
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            return false;
        }
        nob_cmd_free(cmd);
    }

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
        "src/services/http_service.c",
        "src/services/json_service.c",
        "src/services/hash_service.c",
        "src/services/sqlite_service.c",
        "src/services/auth_service.c",
        "src/services/error_service.c",
        "src/services/updater_service.c",
        "src/services/crud_api.c",
        "src/di/di_impl.c",
        "-I./src",
        "-I./thirdparty/webui/include/",
        "-I./thirdparty/sqlite-amalgamation-3510300/",
        "-L./build", "-lwebui-2",
        "build/sqlite3.o",
        "-lpthread", "-ldl"
    );
    if (!nob_cmd_run(&cmd)) {
        nob_cmd_free(cmd);
        return false;
    }
    nob_cmd_free(cmd);

    return true;
}

static bool build_tests(void)
{
    nob_log(NOB_INFO, "Building comprehensive test runner...");

    // Compile SQLite amalgamation (if not already compiled)
    if (!nob_file_exists("build/sqlite3.o")) {
        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "gcc",
            "-c",
            "-o", "build/sqlite3.o",
            "-I./thirdparty/sqlite-amalgamation-3510300/",
            "./thirdparty/sqlite-amalgamation-3510300/sqlite3.c"
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            return false;
        }
        nob_cmd_free(cmd);
    }

    /* Build individual test suites */
    const char* test_suites[] = {
        "logger", "event", "file", "timer", "json", "hash",
        "sqlite", "auth", "error", "updater"
    };

    for (int i = 0; i < 10; i++) {
        char output_path[256], source_path[256];
        snprintf(output_path, sizeof(output_path), "build/test_%s", test_suites[i]);
        snprintf(source_path, sizeof(source_path), "src/tests/suites/test_%s.c", test_suites[i]);

        Nob_Cmd cmd = {0};
        nob_cmd_append(&cmd,
            "gcc",
            "-Wall", "-Wextra", "-g",
            "-o", output_path,
            source_path,
            "src/services/logger_service.c",
            "src/services/config_service.c",
            "src/services/webui_service.c",
            "src/services/event_service.c",
            "src/services/file_service.c",
            "src/services/timer_service.c",
            "src/services/http_service.c",
            "src/services/json_service.c",
            "src/services/hash_service.c",
            "src/services/sqlite_service.c",
            "src/services/auth_service.c",
            "src/services/error_service.c",
            "src/services/updater_service.c",
            "src/di/di_impl.c",
            "-I./src",
            "-I./thirdparty/webui/include/",
            "-I./thirdparty/sqlite-amalgamation-3510300/",
            "-L./build", "-lwebui-2",
            "build/sqlite3.o",
            "-lpthread", "-ldl"
        );
        if (!nob_cmd_run(&cmd)) {
            nob_cmd_free(cmd);
            return false;
        }
        nob_cmd_free(cmd);
    }

    /* Build comprehensive test runner */
    nob_log(NOB_INFO, "Building comprehensive test runner...");

    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd,
        "gcc",
        "-Wall", "-Wextra", "-g",
        "-o", "build/test_all",
        "src/tests/test_all.c",
        "src/services/logger_service.c",
        "src/services/config_service.c",
        "src/services/webui_service.c",
        "src/services/event_service.c",
        "src/services/file_service.c",
        "src/services/timer_service.c",
        "src/services/http_service.c",
        "src/services/json_service.c",
        "src/services/hash_service.c",
        "src/services/sqlite_service.c",
        "src/services/auth_service.c",
        "src/services/error_service.c",
        "src/services/updater_service.c",
        "src/di/di_impl.c",
        "-I./src",
        "-I./thirdparty/webui/include/",
        "-I./thirdparty/sqlite-amalgamation-3510300/",
        "-L./build", "-lwebui-2",
        "build/sqlite3.o",
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

static int do_test(void)
{
    nob_mkdir_if_not_exists("build");

    if (!build_webui_lib()) {
        nob_log(NOB_ERROR, "Failed to build WebUI library");
        return 1;
    }

    if (!build_tests()) {
        nob_log(NOB_ERROR, "Failed to build test runners");
        return 1;
    }

    nob_log(NOB_INFO, "Running comprehensive test suite...");
    printf("\n");

    Nob_Cmd cmd = {0};
    nob_cmd_append(&cmd, "./build/test_all", NULL);
    int result = nob_cmd_run(&cmd);
    nob_cmd_free(cmd);

    return result ? 1 : 0;
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
        } else if (strcmp(argv[1], "test") == 0) {
            cmd = BUILD_CMD_TEST;
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
        case BUILD_CMD_TEST:
            return do_test();
        case BUILD_CMD_HELP:
            print_help(argv[0]);
            return 0;
        default:
            return do_dev();
    }
}
