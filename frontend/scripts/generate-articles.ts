import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Script to bundle markdown articles into a TypeScript module
 * This allows articles to be embedded in the JavaScript bundle for static site deployment
 *
 * This script reads from the root /docs folder and categorizes them into:
 * - FAQ: Short reference documents (services, utilities, API references)
 * - Articles: Longer guides and documentation (overviews, implementations, analyses)
 */

// Root project directory (go up from frontend/scripts)
const ROOT_DIR = join(__dirname, '..');
const DOCS_DIR = join(ROOT_DIR, '..', 'docs');
const OUTPUT_DIR = join(__dirname, '..', 'src', 'app', 'shared');
const OUTPUT_FILE = join(OUTPUT_DIR, 'articles.bundle.ts');

// Patterns to categorize documents
// FAQ: Short reference docs - services, utilities, API references
const FAQ_PATTERNS = [
  /services\//i,           // All service docs
  /utils/i,                // Utility references
  /api/i,                  // API references
  /di-system/i,            // DI system reference
  /coding-?standards/i,    // Coding standards
  /build-?pipeline/i,      // Build pipeline
  /troubleshooting/i,      // Troubleshooting
  /webui-?integration/i,   // WebUI integration
  /metaprogramming/i,      // Metaprogramming
  /libc-?coding/i,         // LibC coding guidelines
  /c-?interop/i,           // C interop guides
];

// Article: Longer guides and documentation
const ARTICLE_PATTERNS = [
  /README/i,               // README files
  /testing/i,              // Testing documentation
  /database/i,             // Database integration
  /duckdb/i,               // DuckDB usage
  /sqlite/i,               // SQLite query builder
  /enterprise/i,           // Enterprise analysis
  /data-?transform/i,      // Data transform services
  /security/i,             // Security documentation
  /implementation/i,       // Implementation summaries
  /refactoring/i,          // Refactoring summaries
  /gap-?analysis/i,        // Gap analysis
  /deployment/i,           // Deployment guides
  /architecture/i,         // Architecture docs
  /frontend-?guide/i,      // Frontend guides
  /backend-?guide/i,       // Backend guides
  /persistent-?storage/i,  // Persistent storage
  /relational-?database/i, // Relational database examples
];

interface Article {
  id: string;
  title: string;
  content: string;
  category: 'faq' | 'article';
  path?: string; // Store relative path for better organization
}

function slugify(filename: string): string {
  // Convert path separators to dashes and remove .md extension
  return filename
    .replace('.md', '')
    .replace(/\//g, '-')
    .replace(/\\/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function formatTitle(filename: string): string {
  // Remove path and extension, then format
  const baseName = filename.split('/').pop()?.split('\\').pop() || filename;
  const title = baseName
    .replace('.md', '')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ');

  // Handle special cases
  const specialCases: Record<string, string> = {
    'di system': 'DI System',
    'api reference': 'API Reference',
    'c interop guide': 'C Interop Guide',
    'c interop utils': 'C Interop Utils',
    'duckdb usage': 'DuckDB Usage',
    'sqlite query builder': 'SQLite Query Builder',
    'sql query builder': 'SQL Query Builder',
    'README': 'README',
  };

  // Capitalize first letter and handle special cases
  const formatted = title.charAt(0).toUpperCase() + title.slice(1);
  return specialCases[formatted] || specialCases[formatted.toLowerCase()] || formatted;
}

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  
  if (!existsSync(dir)) {
    console.warn(`[Generate Articles] Directory not found: ${dir}`);
    return files;
  }
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      // Recursively scan subdirectories
      files.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Add markdown file with its relative path
      files.push(relativePath);
    }
  }
  
  return files;
}

/**
 * Determine if a file should be categorized as FAQ based on patterns
 */
function isFaq(relativePath: string): boolean {
  for (const pattern of FAQ_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true;
    }
  }
  return false;
}

/**
 * Determine if a file should be categorized as Article based on patterns
 */
function isArticle(relativePath: string): boolean {
  for (const pattern of ARTICLE_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true;
    }
  }
  return false;
}

function escapeTemplateLiteral(content: string): string {
  // Escape backticks and ${ to prevent template literal injection
  return content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function generateArticlesBundle(): void {
  console.log('[Generate Articles] Starting...');
  console.log(`[Generate Articles] Reading from: ${DOCS_DIR}`);
  console.log(`[Generate Articles] Writing to: ${OUTPUT_FILE}`);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`[Generate Articles] Created directory: ${OUTPUT_DIR}`);
  }

  const articles: Article[] = [];
  const errors: string[] = [];

  // Find all markdown files dynamically
  console.log('\n[Generate Articles] Scanning for markdown files...');
  const allMarkdownFiles = findMarkdownFiles(DOCS_DIR);
  console.log(`[Generate Articles] Found ${allMarkdownFiles.length} markdown files`);

  if (allMarkdownFiles.length === 0) {
    console.error('[Generate Articles] No markdown files found! Aborting...');
    process.exit(1);
  }

  // Process all markdown files
  console.log('\n[Generate Articles] Processing files...');
  for (const relativePath of allMarkdownFiles) {
    const filePath = join(DOCS_DIR, relativePath);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const id = slugify(relativePath);
      const title = formatTitle(relativePath);

      // Determine category based on patterns
      let category: 'faq' | 'article' = 'article'; // default to article
      
      if (isFaq(relativePath)) {
        category = 'faq';
      } else if (isArticle(relativePath)) {
        category = 'article';
      } else {
        // Default categorization based on path structure
        if (relativePath.includes('services/') || relativePath.includes('utils/')) {
          category = 'faq';
        } else {
          category = 'article';
        }
      }

      articles.push({ id, title, content, category, path: relativePath });
      console.log(`[Generate Articles] ✓ ${category.toUpperCase()}: ${relativePath} (${content.length} chars)`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Error reading ${relativePath}: ${errorMsg}`);
      console.error(`[Generate Articles] Error reading ${relativePath}:`, errorMsg);
    }
  }

  if (articles.length === 0) {
    console.error('[Generate Articles] No articles found! Aborting...');
    process.exit(1);
  }

  // Generate TypeScript module
  const moduleContent = generateModuleContent(articles);

  // Write the bundle file
  writeFileSync(OUTPUT_FILE, moduleContent, 'utf-8');
  console.log(`\n[Generate Articles] ✓ Generated bundle: ${OUTPUT_FILE}`);
  console.log(`[Generate Articles] Total articles: ${articles.length}`);
  console.log(`[Generate Articles] Total size: ${moduleContent.length} chars`);

  if (errors.length > 0) {
    console.log(`[Generate Articles] Warnings: ${errors.length}`);
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  console.log('[Generate Articles] Done!');
}

function generateModuleContent(articles: Article[]): string {
  const timestamp = new Date().toISOString();

  // Generate article data as const for better type safety
  const articlesData = articles
    .map((article) => {
      const escapedContent = escapeTemplateLiteral(article.content);
      return `  {
    id: '${article.id}',
    title: '${article.title.replace(/'/g, "\\'")}',
    content: \`${escapedContent}\`,
    category: '${article.category}'
  }`;
    })
    .join(',\n');

  return `/**
 * Auto-generated articles bundle
 * Generated at: ${timestamp}
 *
 * This file contains all markdown articles bundled into the JavaScript.
 * DO NOT edit this file manually - it will be regenerated on build.
 *
 * To modify articles, edit the .md files in the /docs folder.
 */

import type { Article } from '../services/article.service';

export const ARTICLES_BUNDLE: Article[] = [
${articlesData}
];

export const ARTICLE_IDS = ARTICLES_BUNDLE.map(a => a.id);

export function getBundledArticle(id: string): Article | undefined {
  return ARTICLES_BUNDLE.find(article => article.id === id);
}

export function getAllBundledArticles(): Article[] {
  return ARTICLES_BUNDLE;
}

export function getFaqArticles(): Article[] {
  return ARTICLES_BUNDLE.filter(article => article.category === 'faq');
}

export function getDocumentationArticles(): Article[] {
  return ARTICLES_BUNDLE.filter(article => article.category === 'article');
}
`;
}

// Run the script
generateArticlesBundle();
