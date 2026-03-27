/**
 * Code Block Rendering Types
 * 
 * Different approaches to rendering code blocks with various trade-offs
 */
export enum CodeBlockRendererType {
  /**
   * PLAIN - No syntax highlighting, just monospace text
   * - Fastest rendering
   * - Smallest bundle size
   * - No dependencies
   * - Basic visual appearance
   */
  PLAIN = 'plain',

  /**
   * SHIKI - Full syntax highlighting with Shiki library
   * - Beautiful GitHub-style highlighting
   * - Supports 100+ languages
   * - Larger bundle size (lazy loaded)
   * - Requires WebAssembly
   */
  SHIKI = 'shiki',

  /**
   * SHIKI_MINIMAL - Shiki with minimal theme
   * - Same as SHIKI but with simpler theme
   * - Slightly smaller bundle
   * - Faster initialization
   */
  SHIKI_MINIMAL = 'shiki-minimal',

  /**
   * PRISM - Prism.js syntax highlighting (future option)
   * - Lightweight alternative to Shiki
   * - Many plugins available
   * - Not yet implemented
   */
  PRISM = 'prism',
}

/**
 * Mermaid Diagram Rendering Types
 * 
 * Different approaches to rendering Mermaid diagrams
 */
export enum MermaidRendererType {
  /**
   * SVG_INLINE - Render as inline SVG (default)
   * - Best performance
   * - Full interactivity
   * - Can be styled with CSS
   * - Larger DOM
   */
  SVG_INLINE = 'svg-inline',

  /**
   * SVG_SANDBOXED - Render in sandboxed iframe
   * - Isolated from main document
   * - Better security
   * - Slightly slower
   * - Separate styling context
   */
  SVG_SANDBOXED = 'svg-sandboxed',

  /**
   * PNG_EXPORT - Render as PNG image
   * - Static image
   * - Smallest DOM footprint
   * - No interactivity
   * - Fast initial render
   */
  PNG_EXPORT = 'png-export',

  /**
   * LAZY - Render only when visible
   * - Best for long articles
   * - Uses Intersection Observer
   * - Delays rendering
   * - Best performance for many diagrams
   */
  LAZY = 'lazy',
}

/**
 * Rendering Configuration
 * 
 * Central configuration for all rendering options
 */
export interface RenderingConfig {
  codeBlock: CodeBlockRendererType;
  mermaid: MermaidRendererType;
  enableAnimations: boolean;
  enableCopyButton: boolean;
  enableLineNumbers: boolean;
}

/**
 * Default rendering configuration
 */
export const DEFAULT_RENDERING_CONFIG: RenderingConfig = {
  codeBlock: CodeBlockRendererType.SHIKI,
  mermaid: MermaidRendererType.SVG_INLINE,
  enableAnimations: true,
  enableCopyButton: true,
  enableLineNumbers: false,
};

/**
 * Performance-focused configuration
 */
export const PERFORMANCE_CONFIG: RenderingConfig = {
  codeBlock: CodeBlockRendererType.PLAIN,
  mermaid: MermaidRendererType.LAZY,
  enableAnimations: false,
  enableCopyButton: true,
  enableLineNumbers: false,
};

/**
 * Visual-focused configuration (best appearance)
 */
export const VISUAL_CONFIG: RenderingConfig = {
  codeBlock: CodeBlockRendererType.SHIKI,
  mermaid: MermaidRendererType.SVG_INLINE,
  enableAnimations: true,
  enableCopyButton: true,
  enableLineNumbers: true,
};
