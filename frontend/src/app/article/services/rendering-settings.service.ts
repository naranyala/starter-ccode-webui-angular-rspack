import { Injectable, signal, computed } from '@angular/core';
import {
  CodeBlockRendererType,
  MermaidRendererType,
  RenderingConfig,
  DEFAULT_RENDERING_CONFIG,
  PERFORMANCE_CONFIG,
  VISUAL_CONFIG,
} from '../models/rendering-config';

export type RenderingPreset = 'default' | 'performance' | 'visual' | 'custom';

@Injectable({
  providedIn: 'root',
})
export class RenderingSettingsService {
  private readonly config = signal<RenderingConfig>(DEFAULT_RENDERING_CONFIG);
  readonly preset = signal<RenderingPreset>('default');

  readonly codeBlockRenderer = computed(() => this.config().codeBlock);
  readonly mermaidRenderer = computed(() => this.config().mermaid);
  readonly animationsEnabled = computed(() => this.config().enableAnimations);
  readonly copyButtonEnabled = computed(() => this.config().enableCopyButton);
  readonly lineNumbersEnabled = computed(() => this.config().enableLineNumbers);

  setCodeBlockRenderer(type: CodeBlockRendererType) {
    this.config.update(current => ({
      ...current,
      codeBlock: type,
    }));
    this.preset.set('custom');
  }

  setMermaidRenderer(type: MermaidRendererType) {
    this.config.update(current => ({
      ...current,
      mermaid: type,
    }));
    this.preset.set('custom');
  }

  toggleAnimations() {
    this.config.update(current => ({
      ...current,
      enableAnimations: !current.enableAnimations,
    }));
  }

  toggleCopyButton() {
    this.config.update(current => ({
      ...current,
      enableCopyButton: !current.enableCopyButton,
    }));
  }

  toggleLineNumbers() {
    this.config.update(current => ({
      ...current,
      enableLineNumbers: !current.enableLineNumbers,
    }));
  }

  applyPreset(preset: RenderingPreset) {
    switch (preset) {
      case 'default':
        this.config.set(DEFAULT_RENDERING_CONFIG);
        break;
      case 'performance':
        this.config.set(PERFORMANCE_CONFIG);
        break;
      case 'visual':
        this.config.set(VISUAL_CONFIG);
        break;
      case 'custom':
        // Keep current custom config
        break;
    }
    this.preset.set(preset);
  }

  getConfig(): RenderingConfig {
    return this.config();
  }

  getPreset(): RenderingPreset {
    return this.preset();
  }

  resetToDefaults() {
    this.config.set(DEFAULT_RENDERING_CONFIG);
    this.preset.set('default');
  }

  // Get available options for UI
  getCodeBlockOptions() {
    return [
      { value: CodeBlockRendererType.PLAIN, label: 'Plain Text', description: 'Fastest, no highlighting' },
      { value: CodeBlockRendererType.SHIKI, label: 'Shiki (Full)', description: 'Best highlighting' },
      { value: CodeBlockRendererType.SHIKI_MINIMAL, label: 'Shiki (Minimal)', description: 'Faster highlighting' },
    ];
  }

  getMermaidOptions() {
    return [
      { value: MermaidRendererType.SVG_INLINE, label: 'SVG Inline', description: 'Best performance' },
      { value: MermaidRendererType.SVG_SANDBOXED, label: 'SVG Sandboxed', description: 'More secure' },
      { value: MermaidRendererType.PNG_EXPORT, label: 'PNG Image', description: 'Static, fast' },
      { value: MermaidRendererType.LAZY, label: 'Lazy Load', description: 'Render on scroll' },
    ];
  }
}
