# Static Site Deployment Guide

## Problem

When building and deploying this project as a static site, articles failed to render because:

1. **Markdown files weren't bundled** - The app tried to fetch `.md` files via HTTP at runtime
2. **No server to serve files** - Static hosts don't serve arbitrary files from `/docs` folder
3. **CORS and path issues** - Client-side fetch requests fail on static hosting

## Solution: Bundle Markdown into JavaScript

The solution embeds all markdown content directly into the JavaScript bundle at **build time**, making it accessible without HTTP requests.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Build Process                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📄 docs/*.md  ──┐                                         │
│  📄 docs/*.md  ──┤                                         │
│  📄 docs/*.md  ──┼──► generate-articles.ts ──► 📦          │
│  📄 docs/*.md  ──┤     (Bun script)                         │
│  📄 docs/*.md  ──┘                                         │
│                                                             │
│  src/app/shared/articles.bundle.ts (auto-generated)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Runtime (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ArticleService.getArticles()                               │
│       │                                                     │
│       ▼                                                     │
│  import { ARTICLES_BUNDLE } from './articles.bundle'       │
│       │                                                     │
│       ▼                                                     │
│  Return bundled articles (no HTTP request!)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Files Changed

### 1. `scripts/generate-articles.ts` (NEW)
A Bun script that:
- Reads all markdown files from `/docs`
- Converts them to a TypeScript module
- Exports as `Article[]` array
- Written to `src/app/shared/articles.bundle.ts`

### 2. `src/app/services/article.service.ts` (MODIFIED)
**Before:**
```typescript
import { HttpClient } from '@angular/common/http';

getArticles(): Observable<Article[]> {
  return forkJoin(
    files.map(file => 
      this.http.get(`/docs/${file}`, { responseType: 'text' })
    )
  );
}
```

**After:**
```typescript
import { getAllBundledArticles } from '../shared/articles.bundle';

getArticles(): Observable<Article[]> {
  return of(getAllBundledArticles()); // No HTTP!
}
```

### 3. `rspack.config.js` (MODIFIED)
Added pre-build step:
```javascript
function generateArticlesBundle() {
  execSync('bun run scripts/generate-articles.ts', { 
    stdio: 'inherit' 
  });
}

generateArticlesBundle(); // Run before build
```

### 4. `package.json` (MODIFIED)
Added scripts:
```json
{
  "scripts": {
    "generate:articles": "bun run scripts/generate-articles.ts",
    "build:static": "bun run generate:articles && bun run build:rspack"
  }
}
```

## Usage

### Development (with hot reload)

```bash
# Normal development (articles still work via HTTP)
bun run dev

# Or with bundled articles (recommended)
bun run generate:articles
bun run dev
```

### Production Build

```bash
# Standard build (includes article bundling)
bun run build:rspack

# Or explicitly generate articles first
bun run build:static
```

### Deploy to Static Host

The output in `dist/angular-rspack-demo/` is now fully self-contained:

```bash
# Build
bun run build:rspack

# Deploy (example: Netlify)
cd dist/angular-rspack-demo
npx netlify deploy --prod

# Or copy to any static hosting
# - GitHub Pages
# - Vercel
# - Cloudflare Pages
# - AWS S3 + CloudFront
# - Firebase Hosting
```

## Benefits

### ✅ No Runtime Dependencies
- No HTTP requests for content
- No CORS issues
- No 404 errors for missing files

### ✅ Better Performance
- Articles load instantly (no network delay)
- Single bundle request
- Better caching

### ✅ Works Everywhere
- Static hosting ✅
- CDN deployment ✅
- Offline mode ✅
- Local file:// opening ✅

### ✅ Type Safety
- TypeScript interfaces
- Compile-time checking
- IDE autocomplete

## Trade-offs

### ⚠️ Larger Bundle Size
Each article adds to the JavaScript bundle size. For 10 articles (~125KB raw), the bundle increases by ~100-150KB after minification.

**Mitigation:**
- Code splitting (lazy load articles)
- Only bundle frequently accessed articles
- Compress with gzip/brotli (standard on all hosts)

### ⚠️ Content Updates Require Rebuild
Changing a `.md` file requires rebuilding the app.

**Solution:**
```bash
# Quick regeneration
bun run generate:articles

# Then rebuild
bun run build:rspack
```

## Architecture

### Bundle Structure

```typescript
// src/app/shared/articles.bundle.ts
export const ARTICLES_BUNDLE: Article[] = [
  {
    id: '01-getting-started',
    title: 'Getting Started',
    content: '# Getting Started\n\n...'
  },
  // ... more articles
];

export function getBundledArticle(id: string): Article | undefined
export function getAllBundledArticles(): Article[]
```

### Article Interface

```typescript
interface Article {
  id: string;        // Slugified filename
  title: string;     // Formatted title
  content: string;   // Raw markdown
}
```

## Troubleshooting

### Articles Not Updating

**Problem:** Changes to `.md` files don't appear

**Solution:**
```bash
# Regenerate the bundle
bun run generate:articles

# Rebuild
bun run build:rspack
```

### Build Fails with "Module Not Found"

**Problem:** `articles.bundle.ts` not found

**Solution:**
1. Ensure `scripts/generate-articles.ts` runs successfully
2. Check that `docs/` folder exists with `.md` files
3. Run manually: `bun run generate:articles`

### Bundle Too Large

**Problem:** JavaScript bundle exceeds size limits

**Solutions:**
1. **Lazy loading:** Split articles into separate chunks
2. **Compression:** Enable gzip/brotli on hosting
3. **Selective bundling:** Only bundle popular articles
4. **Hybrid approach:** Bundle summary, fetch full content on demand

## Advanced: Hybrid Approach (Future Enhancement)

For large sites with many articles, consider:

```typescript
// Bundle metadata, fetch content on demand
export const ARTICLE_METADATA = [
  { id: 'article-1', title: '...', excerpt: '...' },
  // ...
];

// Fetch full content only when needed
async function getArticleContent(id: string) {
  // Try bundle first
  const bundled = getBundledArticle(id);
  if (bundled) return bundled;
  
  // Fallback to fetch (for large articles)
  const response = await fetch(`/articles/${id}.md`);
  return response.text();
}
```

## Testing

### Verify Bundle Generation

```bash
# Check generated file exists
ls -lh src/app/shared/articles.bundle.ts

# Check content
head -50 src/app/shared/articles.bundle.ts
```

### Verify Build Output

```bash
# Build
bun run build:rspack

# Check dist folder
ls -lh dist/angular-rspack-demo/

# Should NOT have /docs folder (articles are in JS)
```

### Test Locally

```bash
# Build
bun run build:rspack

# Serve statically
cd dist/angular-rspack-demo
bunx serve

# Open http://localhost:3000
# Articles should load without network requests
```

### Check Network Tab

In browser DevTools:
1. Open Network tab
2. Load articles page
3. **Should NOT see** requests to `/docs/*.md`
4. **Should see** single bundle request

## Migration Checklist

- [x] Create `scripts/generate-articles.ts`
- [x] Update `article.service.ts` to use bundle
- [x] Update `rspack.config.js` to run generation
- [x] Add npm scripts to `package.json`
- [x] Test build process
- [x] Verify articles render correctly
- [ ] Update CI/CD pipeline (if needed)
- [ ] Update deployment documentation

## Summary

**Before:** Articles loaded via HTTP → ❌ Fails on static hosting

**After:** Articles bundled in JavaScript → ✅ Works everywhere

The solution is production-ready and deployed with a simple `bun run build:rspack`.
