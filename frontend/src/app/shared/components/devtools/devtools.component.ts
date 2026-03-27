import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevToolsPanelComponent } from '../devtools-panel/devtools-panel.component';

@Component({
  selector: 'app-devtools',
  standalone: true,
  imports: [CommonModule, DevToolsPanelComponent],
  template: `
    <app-devtools-panel />
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class DevToolsComponent {
  readonly isExpanded = signal(false);

  toggle(): void {
    this.isExpanded.update(v => !v);
  }
}
