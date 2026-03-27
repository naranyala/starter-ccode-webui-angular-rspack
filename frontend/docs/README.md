# Documentation Index

Welcome to the Angular Rspack Demo documentation.

## Documentation Structure

### Getting Started
- [Getting Started](./01-getting-started.md) - Installation, setup, and first steps
  - Prerequisites
  - Installation guide
  - Development server
  - Building for production
  - Troubleshooting

### Architecture and Design
- [Architecture](./02-architecture.md) - Application structure and patterns
  - Technology stack
  - File organization
  - Component architecture
  - State management with signals
  - Routing configuration
  - Build system overview
  - Design patterns

### Features
- [WinBox Panel](./03-winbox-panel.md) - Window management system
  - Panel structure (two-row design)
  - Window lifecycle
  - Service API reference
  - Component API reference
  - Styling and theming
  - Code block features
  - Best practices

- [DevTools](./08-devtools.md) - Collapsible bottom debugging panel
  - Overview and features
  - Component API
  - Tabs reference
  - Styling
  - Customization

### Development
- [Components](./04-components.md) - Component documentation
  - Page components (Home, Demo)
  - Shared components (WinBoxPanel)
  - Optional components (DevTools)
  - Component patterns
  - Testing guide

- [Styling](./05-styling.md) - CSS and theming guide
  - CSS architecture
  - Color system
  - Typography
  - Spacing
  - Responsive design
  - Dark theme
  - Best practices

- [Utilities](./09-utilities.md) - Reusable utilities library
  - Services (Storage, Clipboard, Platform, Notification)
  - Utility functions (Format, String, Validation, Time, Array, Object)
  - Pipes (Format, String)
  - Directives (ClickOutside, LazyLoad, etc.)
  - Usage examples

### Deployment
- [Build and Deploy](./06-build-deploy.md) - Build and deployment guide
  - Build process
  - Configuration
  - Optimization techniques
  - Deployment options (Netlify, Vercel, GitHub Pages)
  - Docker deployment
  - CI/CD setup
  - Monitoring

### Future
- [Improvement Suggestions](./07-improvements.md) - Future enhancements
  - High priority improvements
  - Medium priority features
  - Low priority enhancements
  - Technical debt
  - Implementation roadmap

### DevTools
- [DevTools Guide](./08-devtools.md) - DevTools panel documentation
  - Overview and features
  - Component API
  - Tabs reference
  - Styling
  - Customization

---

## Quick Reference

### Commands

```bash
# Development
bun run dev              # Start dev server
bun run setup:prism      # Setup syntax highlighting

# Building
bun run build:rspack     # Production build
bun run serve:rspack     # Serve production build

# Testing
bun run test            # Run tests
bun run test:watch      # Watch mode
bun run e2e             # E2E tests

# Code Quality
bun run lint            # Auto-fix linting
bun run lint:check      # Check only
bun run format          # Format code
```

### File Locations

```
src/
├── app/
│   ├── home/           # Home page
│   ├── demo/           # Demo page
│   ├── devtools/       # DevTools panel
│   └── shared/         # Shared components
├── styles.css          # Global styles
└── index.html          # Main HTML

docs/
├── 01-getting-started.md
├── 02-architecture.md
├── 03-winbox-panel.md
├── 04-components.md
├── 05-styling.md
├── 06-build-deploy.md
├── 07-improvements.md
└── 08-devtools.md
```

### Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| Angular 19 | Frontend framework | [angular.io](https://angular.io/docs) |
| Rspack | Bundler | [rspack.dev](https://rspack.dev/) |
| Bun | Runtime | [bun.sh](https://bun.sh/docs) |
| Biome | Linter/Formatter | [biomejs.dev](https://biomejs.dev/) |
| Mermaid.js | Diagram Rendering | [mermaid.js.org](https://mermaid.js.org/) |

### Diagram Support

This documentation uses **Mermaid.js** for rendering diagrams. All markdown files support Mermaid syntax:

```mermaid
graph LR
    A[Markdown] --> B[Mermaid Code]
    B --> C[Rendered Diagram]
    
    style A fill:#161b22,stroke:#30363d,color:#e6edf3
    style B fill:#1f6feb,stroke:#30363d,color:#e6edf3
    style C fill:#238636,stroke:#30363d,color:#e6edf3
```

Supported diagram types:
- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Gantt charts
- Pie charts

---

## Common Tasks

### Adding a New Component

1. Create component files:
```bash
mkdir src/app/my-feature
touch src/app/my-feature/my-feature.component.ts
touch src/app/my-feature/my-feature.component.css
```

2. Implement component:
```typescript
@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-feature.component.html',
  styleUrls: ['./my-feature.component.css'],
})
export class MyFeatureComponent {}
```

3. Add to routing or parent template

### Adding a New Route

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'new-feature',
    loadComponent: () => import('./my-feature/my-feature.component')
      .then(m => m.MyFeatureComponent),
  },
];
```

### Adding Styles

```css
/* In component CSS file */
.my-component {
  display: flex;
  gap: 16px;
  padding: 20px;
}
```

---

## External Resources

### Official Documentation
- [Angular Documentation](https://angular.io/docs)
- [Rspack Documentation](https://rspack.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Documentation](https://typescriptlang.org/docs)
- [Biome Documentation](https://biomejs.dev/)

### Tools and Libraries
- [WinBox.js](https://winbox.krawaller.se/)
- [Prism.js](https://prismjs.com/)

### Tutorials and Guides
- [Angular University](https://angular-university.io/)
- [NetBasics](https://netbasal.com/)
- [inDepth.dev](https://indepth.dev/)

---

## Support

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Documentation**: Browse the docs folder

## Contributing

See [README.md](../README.md#contributing) for contribution guidelines.

---

**Last Updated:** March 2026
**Version:** 1.0.0
