# Quick Start Guide

## Prerequisites

Ensure you have the following installed:

- **GCC 9+** (C compiler)
- **Bun 1.0+** (package manager)
- **SQLite3** (optional, for CLI access)

## Installation

```bash
# Install frontend dependencies
cd frontend && bun install

# Build and run (full stack)
./run.sh dev

# Build only
./run.sh build

# Run backend tests
./run.sh test
```

## First Run

On first execution, the application will:

1. Create the `data/` directory
2. Initialize SQLite database with schema migrations
3. Insert seed data for demonstration
4. Launch the WebUI window with Angular frontend

## Database Options

The application supports two database engines:

### SQLite (Default)
- Best for: CRUD operations, user management, transactional workloads
- File location: `data/app.db`

### DuckDB
- Best for: Analytics, reporting, complex aggregations
- File location: `data/analytics.db`

## Accessing the Application

Access the application through:
- The native WebUI window (automatically launched)
- Browser at the displayed URL (typically `http://localhost:8080`)

## Next Steps

1. Explore the **Database Demos** section to see CRUD operations in action
2. Check the **Documentation** section for detailed guides
3. Review the **API Reference** for endpoint documentation

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
./run.sh clean
./run.sh rebuild
```

### Database Errors
```bash
# Remove database and restart (will reinitialize)
rm data/app.db
./run.sh dev
```

### Frontend Issues
```bash
# Reinstall frontend dependencies
cd frontend
rm -rf node_modules
bun install
```
