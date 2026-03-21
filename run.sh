#!/bin/bash
# run.sh - Wrapper script for build.c
# Usage: ./run.sh [command]
#
# Commands:
#   build   - Build the project only
#   dev     - Build and run the application
#   clean   - Remove build artifacts
#   run     - Build and run the application
#   rebuild - Clean and rebuild
#   help    - Show help message

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Show help if no arguments provided
if [ $# -eq 0 ]; then
    # Compile build.c if needed
    if [ ! -f "build_runner" ] || [ "build.c" -nt "build_runner" ] || [ "nob.h" -nt "build_runner" ]; then
        echo "[INFO] Compiling build script..."
        gcc -o build_runner build.c
    fi
    ./build_runner help
    exit 0
fi

# Compile build.c if needed
if [ ! -f "build_runner" ] || [ "build.c" -nt "build_runner" ] || [ "nob.h" -nt "build_runner" ]; then
    echo "[INFO] Compiling build script..."
    gcc -o build_runner build.c
fi

# Run the build script with arguments
./build_runner "$@"
