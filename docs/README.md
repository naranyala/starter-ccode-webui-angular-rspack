# Project Documentation

This directory contains comprehensive documentation for the C + Angular WebUI project.

## Documentation Structure

```
docs/
├── README.md                 # This file - Documentation index
├── backend/                  # Backend documentation
│   ├── README.md             # Backend overview
│   ├── di-system.md          # Dependency Injection system guide
│   └── services/             # Individual service documentation
│       ├── logger.md
│       ├── config.md
│       ├── event.md
│       ├── file.md
│       ├── timer.md
│       ├── json.md
│       ├── hash.md
│       ├── http.md
│       └── webui.md
│
└── frontend/                 # Frontend documentation
    ├── README.md             # Frontend overview
    ├── services/             # Service documentation
    │   ├── api.md
    │   ├── cache.md
    │   ├── query.md
    │   └── task.md
    └── components/           # Component documentation
        └── app.md
```

## Quick Links

### Backend Documentation

- [Backend Overview](backend/README.md) - Architecture and service registry
- [DI System Guide](backend/di-system.md) - Using the dependency injection system
- [Service Documentation](backend/services/) - Individual service guides

### Frontend Documentation

- [Frontend Overview](frontend/README.md) - Architecture and service registry
- [Service Documentation](frontend/services/) - Individual service guides
- [Component Documentation](frontend/components/) - Component guides

### Additional Documentation

- [AUDIT_SUMMARY.md](../AUDIT_SUMMARY.md) - Service architecture documentation
- [src/di/README.md](../src/di/README.md) - DI system technical documentation
- [frontend/README.md](../frontend/README.md) - Frontend-specific documentation
- [frontend/docs/](../frontend/docs/) - Additional frontend docs

## Documentation Standards

### File Naming

- Use lowercase with hyphens: `service-name.md`
- Use README.md for overview files in directories

### Content Structure

1. Title (H1)
2. Overview/Description
3. API Reference
4. Usage Examples
5. Related Documentation

### Code Examples

Use fenced code blocks with language specification:

```c
// C code example
LoggerService* logger = logger_service_inject();
```

```typescript
// TypeScript code example
const logger = inject(LoggerService);
```

## Contributing to Documentation

1. Keep documentation close to the code it describes
2. Update documentation when changing functionality
3. Use clear, concise language
4. Include practical examples
5. Link to related documentation
