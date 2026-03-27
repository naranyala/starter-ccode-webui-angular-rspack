import { Component, inject, signal } from '@angular/core';
import { TablerIconComponent } from '../../../shared/components/tabler-icon/tabler-icon.component';
import type { CodeBlockRendererType, MermaidRendererType } from '../../models/rendering-config';
import {
  type RenderingPreset,
  RenderingSettingsService,
} from '../../services/rendering-settings.service';

@Component({
  selector: 'app-rendering-controls',
  standalone: true,
  imports: [TablerIconComponent],
  template: `
    <div class="rendering-controls">
      <div class="controls-header">
        <h3><tabler-icon name="settings" [size]="18" /> Rendering Options</h3>
        <button class="toggle-btn" (click)="toggleExpanded()" aria-label="Toggle rendering controls">
          <tabler-icon [name]="expanded() ? 'chevronDown' : 'chevronRight'" [size]="16" />
        </button>
      </div>

      @if (expanded()) {
        <div class="controls-content">
          <!-- Preset Selector -->
          <div class="control-group">
            <label>Preset</label>
            <div class="preset-buttons">
              @for (option of presetOptions; track option.value) {
                <button
                  class="preset-btn"
                  [class.active]="preset() === option.value"
                  (click)="applyPreset(option.value)">
                  {{ option.label }}
                </button>
              }
            </div>
          </div>

          <!-- Code Block Renderer -->
          <div class="control-group">
            <label>Code Block Rendering</label>
            <select [value]="codeBlockRenderer()" (change)="onCodeBlockChange($event)">
              @for (option of codeBlockOptions; track option.value) {
                <option [value]="option.value">{{ option.label }} - {{ option.description }}</option>
              }
            </select>
          </div>

          <!-- Mermaid Renderer -->
          <div class="control-group">
            <label>Mermaid Diagram Rendering</label>
            <select [value]="mermaidRenderer()" (change)="onMermaidChange($event)">
              @for (option of mermaidOptions; track option.value) {
                <option [value]="option.value">{{ option.label }} - {{ option.description }}</option>
              }
            </select>
          </div>

          <!-- Toggles -->
          <div class="control-group">
            <label class="toggle-label">
              <input type="checkbox" [checked]="animationsEnabled()" (change)="toggleAnimations()" />
              <span>Enable Animations</span>
            </label>

            <label class="toggle-label">
              <input type="checkbox" [checked]="copyButtonEnabled()" (change)="toggleCopyButton()" />
              <span>Show Copy Button</span>
            </label>
          </div>

          <!-- Reset -->
          <button class="reset-btn" (click)="reset()">
            <tabler-icon name="refresh" [size]="16" /> Reset to Defaults
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      margin-bottom: 20px;
    }

    .rendering-controls {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      overflow: hidden;
    }

    .controls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #21262d;
      border-bottom: 1px solid #30363d;
    }

    .controls-header h3 {
      margin: 0;
      font-size: 0.9rem;
      color: #e6edf3;
      font-weight: 600;
    }

    .toggle-btn {
      background: transparent;
      border: 1px solid #30363d;
      color: #8b949e;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: #30363d;
      color: #e6edf3;
    }

    .controls-content {
      padding: 16px;
    }

    .control-group {
      margin-bottom: 16px;
    }

    .control-group label {
      display: block;
      font-size: 0.8rem;
      color: #8b949e;
      margin-bottom: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .preset-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .preset-btn {
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .preset-btn:hover {
      background: #30363d;
      border-color: #484f58;
    }

    .preset-btn.active {
      background: #1f6feb;
      border-color: #388bfd;
      color: #fff;
    }

    select {
      width: 100%;
      background: #21262d;
      border: 1px solid #30363d;
      color: #e6edf3;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
    }

    select:focus {
      border-color: #1f6feb;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      user-select: none;
    }

    .toggle-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #1f6feb;
    }

    .toggle-label span {
      font-size: 0.9rem;
      color: #c9d1d9;
    }

    .reset-btn {
      width: 100%;
      background: #21262d;
      border: 1px solid #f85149;
      color: #f85149;
      padding: 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s;
      margin-top: 8px;
    }

    .reset-btn:hover {
      background: rgba(248,81,73,0.1);
      border-color: #ff7b72;
    }
  `,
  ],
})
export class RenderingControlsComponent {
  private readonly settingsService = inject(RenderingSettingsService);

  readonly expanded = signal(false);
  readonly preset = this.settingsService.preset;
  readonly codeBlockRenderer = this.settingsService.codeBlockRenderer;
  readonly mermaidRenderer = this.settingsService.mermaidRenderer;
  readonly animationsEnabled = this.settingsService.animationsEnabled;
  readonly copyButtonEnabled = this.settingsService.copyButtonEnabled;

  readonly presetOptions: { value: RenderingPreset; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'performance', label: 'Performance' },
    { value: 'visual', label: 'Visual' },
  ];

  readonly codeBlockOptions = this.settingsService.getCodeBlockOptions();
  readonly mermaidOptions = this.settingsService.getMermaidOptions();

  toggleExpanded() {
    this.expanded.update((v) => !v);
  }

  applyPreset(preset: RenderingPreset) {
    this.settingsService.applyPreset(preset);
  }

  onCodeBlockChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as CodeBlockRendererType;
    this.settingsService.setCodeBlockRenderer(value);
  }

  onMermaidChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as MermaidRendererType;
    this.settingsService.setMermaidRenderer(value);
  }

  toggleAnimations() {
    this.settingsService.toggleAnimations();
  }

  toggleCopyButton() {
    this.settingsService.toggleCopyButton();
  }

  reset() {
    this.settingsService.resetToDefaults();
  }
}
