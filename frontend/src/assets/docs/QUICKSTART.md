# Developer Quickstart Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| GCC | 9+ | C compiler |
| Bun | 1.0+ | Frontend package manager |
| SQLite3 | 3.x | Database CLI |

## Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repo-url>
cd starter-ccode-webui-angular-rspack

# Install frontend dependencies
cd frontend && bun install
```

### 2. First Run

```bash
# Full stack development (frontend + backend)
./run.sh dev

# Or separate:
cd frontend && bun run dev   # Frontend only
./run.sh build && ./build/main  # Backend only
```

## Development Workflow

### Frontend Development

```bash
cd frontend

# Start dev server with hot reload
bun run dev

# Run tests
bun test

# Lint and fix
bun run lint:fix
```

### Backend Development

```bash
# Rebuild on changes
find src -name "*.c" | entr -r ./run.sh build

# Run tests
./run.sh test
```

## Project Layout

```
.
├── frontend/           # Angular app
│   ├── src/
│   │   ├── core/      # Services
│   │   └── views/     # Components
│   └── package.json
│
├── src/               # C backend
│   ├── main.c
│   ├── services/      # 16 services
│   └── di/           # DI system
│
├── data/              # App data
│   └── app.db        # SQLite database
│
└── build/             # Build output
```

## Common Issues

### "node_modules not found"
```bash
cd frontend && bun install
```

### "Database locked"
```bash
# Close any running instances
# Or delete and recreate
rm data/app.db
```

### "Port already in use"
```bash
# Find and kill process
lsof -i :8080
kill <PID>
```

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Testing Guide](./TESTING.md)
