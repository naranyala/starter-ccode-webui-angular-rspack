import { Component, Input, inject } from '@angular/core';
import { LucideIconsService } from '../../services/lucide-icons.service';

@Component({
  selector: 'tabler-icon',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="viewBox"
      [attr.width]="size"
      [attr.height]="size"
      [attr.stroke]="color"
      [attr.stroke-width]="strokeWidth"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      [innerHTML]="getIconPath()">
    </svg>
  `,
  styles: [
    `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 0;
    }

    :host svg {
      display: block;
    }
  `,
  ],
})
export class TablerIconComponent {
  private readonly iconsService = inject(LucideIconsService);

  @Input() name: string = 'circle';
  @Input() size: string | number = 24;
  @Input() color: string = 'currentColor';
  @Input() strokeWidth: number = 2;
  @Input() viewBox: string = '0 0 24 24';

  getIconPath(): string {
    return this.iconsService.getIcon(this.name) || '';
  }
}
