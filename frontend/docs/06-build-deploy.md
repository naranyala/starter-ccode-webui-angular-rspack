# Build & Deploy Guide

Complete guide to building, optimizing, and deploying the application.

## Table of Contents

- [Overview](#overview)
- [Build Process](#build-process)
- [Build Configuration](#build-configuration)
- [Optimization](#optimization)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Monitoring](#monitoring)

## Overview

### Build Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **Rspack** | Module bundler | Latest |
| **esbuild** | TypeScript compilation | Via esbuild-loader |
| **Bun** | Runtime & scripts | 1.x |
| **Prism.js** | Syntax highlighting | 1.29.x |

### Build Outputs

```mermaid
graph TB
    subgraph Dist["dist/angular-rspack-demo/"]
        direction TB
        HTML["index.html"]
        MAIN["main.[hash].js"]
        MAP["main.[hash].js.map"]
        VENDORS["vendors.[hash].js"]
        STYLES["styles.[hash].css"]
        
        subgraph Prism["prism/"]
            P1[prism.js]
            P2[prism-typescript.min.js]
            P3[...]
        end
        
        subgraph WinBox["winbox/"]
            W1[winbox.bundle.min.js]
            W2[winbox.css]
        end
    end
    
    style Dist fill:#161b22,stroke:#30363d,color:#e6edf3
    style Prism fill:#d29922,stroke:#30363d,color:#e6edf3
    style WinBox fill:#1f6feb,stroke:#30363d,color:#e6edf3
```

## Build Process

### Development Build

```bash
bun run dev
```

**Features:**
- Hot Module Replacement (HMR)
- Source maps
- Fast rebuilds
- No optimization

**Output:** Served from memory (not written to disk)

### Production Build

```bash
bun run build:rspack
```

**What happens:**
1. Rspack compiles TypeScript → JavaScript
2. Processes SCSS/CSS → optimized CSS
3. Bundles all modules
4. Tree shaking (removes unused code)
5. Minification
6. Code splitting
7. Copies WinBox.js files
8. Copies Prism.js files
9. Writes to `dist/angular-rspack-demo/`

**Build Script:**
```json
{
  "scripts": {
    "build:rspack": "bun run rspack build && bun run scripts/copy-prism.js && cp -r node_modules/winbox/dist/* dist/angular-rspack-demo/"
  }
}
```

### Serve Production Build

```bash
bun run serve:rspack
```

Or use any static file server:

```bash
cd dist/angular-rspack-demo
bunx serve
# or
python -m http.server 8000
# or
npx http-server
```

## Build Configuration

### Rspack Config

**File:** `rspack.config.js`

```javascript
module.exports = async (env, argv) => {
  const isDev = argv.mode === 'development';
  
  return {
    mode: isDev ? 'development' : 'production',
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist/angular-rspack-demo'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.mjs', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'esbuild-loader',
            options: {
              target: 'es2022',
            },
          },
        },
        {
          test: /\.scss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new HtmlRspackPlugin({
        template: './src/index.html',
        scriptLoading: 'defer',
      }),
    ],
    optimization: {
      minimize: !isDev,
      splitChunks: {
        chunks: 'all',
      },
    },
  };
};
```

### TypeScript Config

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Environment Variables

**Development:**
```bash
# .env (if using)
NODE_ENV=development
PORT=4200
```

**Production:**
```bash
NODE_ENV=production
```

## Optimization

### Bundle Analysis

```bash
# Install bundle analyzer
bun add -D webpack-bundle-analyzer

# Add to rspack.config.js plugins
new BundleAnalyzerPlugin()
```

### Optimization Techniques

#### 1. Code Splitting

```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
}
```

#### 2. Tree Shaking

Automatic with ES modules. Ensure:
- Use ES module syntax (`import`/`export`)
- Mark side-effect-free files in `package.json`:

```json
{
  "sideEffects": false
}
```

#### 3. Lazy Loading

```typescript
// Route-level code splitting
{
  path: 'demo',
  loadComponent: () => import('./demo/demo.component')
    .then(m => m.DemoComponent)
}
```

#### 4. Asset Optimization

```javascript
{
  test: /\.(png|jpe?g|gif|svg)$/,
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 8 * 1024, // 8kb
    },
  },
}
```

### Performance Metrics

| Metric | Target | Typical |
|--------|--------|---------|
| Initial Bundle | < 500KB | ~380KB |
| Load Time | < 2s | ~1.2s |
| TTI | < 3s | ~1.8s |
| Lighthouse | > 90 | 94 |

## Deployment

### Deployment Options

```mermaid
flowchart TB
    subgraph Build["Build Stage"]
        B1[Source Code]
        B2[bun run build:rspack]
        B3[dist/angular-rspack-demo/]
    end
    
    subgraph Deploy["Deployment Targets"]
        direction TB
        D1["Netlify<br/>Static Hosting"]
        D2["Vercel<br/>Serverless Platform"]
        D3["GitHub Pages<br/>Static Site"]
        D4["Docker<br/>Container"]
    end
    
    subgraph CI["CI/CD Pipeline"]
        C1[GitHub Actions]
        C2[Build & Test]
        C3[Auto Deploy]
    end
    
    Build --> Deploy
    Build --> CI
    CI --> Deploy
    
    style Build fill:#161b22,stroke:#30363d,color:#e6edf3
    style Deploy fill:#161b22,stroke:#30363d,color:#e6edf3
    style CI fill:#161b22,stroke:#30363d,color:#e6edf3
    style B1 fill:#0d1117,stroke:#30363d,color:#8b949e
    style B2 fill:#238636,stroke:#30363d,color:#e6edf3
    style B3 fill:#1f6feb,stroke:#30363d,color:#e6edf3
    style D1 fill:#1f6feb,stroke:#30363d,color:#e6edf3
    style D2 fill:#d29922,stroke:#30363d,color:#e6edf3
    style D3 fill:#8b949e,stroke:#30363d,color:#e6edf3
    style D4 fill:#238636,stroke:#30363d,color:#e6edf3
    style C1 fill:#8b949e,stroke:#30363d,color:#e6edf3
    style C2 fill:#238636,stroke:#30363d,color:#e6edf3
    style C3 fill:#1f6feb,stroke:#30363d,color:#e6edf3
```

### Static Hosting

#### Netlify

**File:** `netlify.toml`

```toml
[build]
  command = "bun run build:rspack"
  publish = "dist/angular-rspack-demo"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Deploy:**
```bash
netlify deploy --prod
```

#### Vercel

**File:** `vercel.json`

```json
{
  "buildCommand": "bun run build:rspack",
  "outputDirectory": "dist/angular-rspack-demo",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Deploy:**
```bash
vercel --prod
```

#### GitHub Pages

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
      
      - run: bun install
      - run: bun run build:rspack
      
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/angular-rspack-demo
```

### Docker Deployment

**File:** `Dockerfile`

```dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build:rspack

FROM nginx:alpine
COPY --from=builder /app/dist/angular-rspack-demo /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**File:** `nginx.conf`

```nginx
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /prism/ {
    alias /usr/share/nginx/html/prism/;
  }
}
```

**Build & Run:**
```bash
docker build -t angular-rspack-demo .
docker run -p 80:80 angular-rspack-demo
```

## CI/CD

### GitHub Actions

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Lint
        run: bun run lint:check
      
      - name: Build
        run: bun run build:rspack
      
      - name: Test
        run: bun run test
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/angular-rspack-demo
```

### Environment-Specific Builds

```bash
# Development
bun run build:rspack -- --mode development

# Staging
NODE_ENV=staging bun run build:rspack

# Production
NODE_ENV=production bun run build:rspack
```

## Monitoring

### Performance Monitoring

#### Lighthouse CI

**File:** `.lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist/angular-rspack-demo",
      "url": ["http://localhost/"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "performance": "error",
        "accessibility": "error",
        "best-practices": "error",
        "seo": "error"
      }
    }
  }
}
```

#### Web Vitals

Add to `main.ts`:

```typescript
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);
```

### Error Tracking

#### Sentry Integration

```bash
bun add @sentry/angular-ivy
```

```typescript
import * as Sentry from "@sentry/angular-ivy";

Sentry.init({
  dsn: 'your-dsn',
  environment: environment.production ? 'production' : 'development',
});
```

## Troubleshooting

### Build Fails

**Common Issues:**

1. **TypeScript errors:**
   ```bash
   bun run tsc --noEmit
   ```

2. **Missing dependencies:**
   ```bash
   bun install
   ```

3. **Cache issues:**
   ```bash
   rm -rf node_modules/.cache dist
   bun run build:rspack
   ```

### Large Bundle Size

**Solutions:**
1. Check for duplicate dependencies
2. Use lazy loading for routes
3. Analyze bundle with webpack-bundle-analyzer
4. Remove unused imports

### Production Build Different from Dev

**Check:**
1. Environment variables
2. Production flags in code
3. Angular production mode
4. Minification issues

## Next Steps

- [Improvement Suggestions](./07-improvements.md) - Future enhancements
- [Architecture](./02-architecture.md) - Review architecture
- [Components](./04-components.md) - Component documentation
