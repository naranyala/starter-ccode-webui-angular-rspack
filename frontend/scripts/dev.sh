#!/bin/bash

# Script to handle port duplication when running dev server
# Usage: ./scripts/dev.sh [--force] [-f]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_PORT=4201

# Parse arguments
FORCE=false
for arg in "$@"; do
  case $arg in
    --force|-f)
      FORCE=true
      shift
      ;;
  esac
done

echo "🔍 Checking for port conflicts..."

# Check if port is available and get next available if needed
RESULT=$(bun run "$SCRIPT_DIR/check-port.js" $DEFAULT_PORT)
echo "$RESULT"

if [[ "$RESULT" == *"NEXT_AVAILABLE_PORT="* ]]; then
  NEXT_PORT=$(echo "$RESULT" | grep "NEXT_AVAILABLE_PORT=" | cut -d'=' -f2)
  echo "⚠️  Port $DEFAULT_PORT is in use. Suggested alternative: $NEXT_PORT"
  echo ""
  echo "Options:"
  echo "  1. Run with --force to kill existing process on port $DEFAULT_PORT"
  echo "  2. Manually set PORT environment variable: PORT=$NEXT_PORT bun run dev"
  echo "  3. Modify rspack.config.js to use a different port"
  echo ""
  read -p "Do you want to force kill the process on port $DEFAULT_PORT? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    FORCE=true
  fi
fi

if [ "$FORCE" = true ]; then
  echo "🔨 Force killing process on port $DEFAULT_PORT..."
  bun run "$SCRIPT_DIR/check-port.js" $DEFAULT_PORT --force
  
  # Verify port is now available
  if ! bun run "$SCRIPT_DIR/check-port.js" $DEFAULT_PORT > /dev/null 2>&1; then
    echo "❌ Failed to free port $DEFAULT_PORT"
    exit 1
  fi
fi

echo "🚀 Starting dev server on port $DEFAULT_PORT..."
echo ""

# Start the dev server
bun run rspack serve
