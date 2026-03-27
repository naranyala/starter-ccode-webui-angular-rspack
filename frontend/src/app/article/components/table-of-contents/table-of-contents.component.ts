import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { TablerIconComponent } from '../../../shared/components/tabler-icon/tabler-icon.component';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  imports: [TablerIconComponent],
  template: `
    <aside class="toc-sidebar" [class.mobile-open]="isOpen()">
      <button class="toc-toggle" (click)="toggle()" aria-label="Toggle table of contents">
        <span>On this page</span>
        <tabler-icon [name]="isOpen() ? 'chevronDown' : 'chevronRight'" [size]="16" class="toc-arrow" [class.expanded]="isOpen()" />
      </button>
      <nav class="toc" [class.collapsed]="!isOpen()">
        <ul>
          @for (item of items; track item.id) {
            <li [style.paddingLeft.px]="(item.level - 2) * 12">
              <a [href]="'#' + item.id" (click)="onItemClick($event, item.id)">{{ item.text }}</a>
            </li>
          }
        </ul>
      </nav>
    </aside>
  `,
  styles: [
    `
    :host {
      display: block;
    }

    .toc-sidebar {
      position: sticky;
      top: 100px;
      height: fit-content;
    }

    .toc-toggle {
      display: none;
      width: 100%;
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      padding: 14px 18px;
      border-radius: 10px;
      cursor: pointer;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 12px;
      transition: all 0.2s;
    }

    .toc-toggle:hover {
      background: #30363d;
      border-color: #484f58;
    }

    @media (max-width: 768px) {
      .toc-toggle {
        display: flex;
      }
    }

    .toc-arrow {
      font-size: 0.75rem;
      transition: transform 0.2s;
      display: inline-block;
    }

    .toc-arrow.expanded {
      transform: rotate(90deg);
    }

    .toc {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      max-height: 500px;
      opacity: 1;
    }

    .toc.collapsed {
      max-height: 0;
      opacity: 0;
      padding: 0;
      border: none;
    }

    @media (max-width: 768px) {
      .toc.collapsed {
        display: none;
      }
      .toc {
        max-height: none;
      }
    }

    .toc ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .toc li {
      margin: 6px 0;
    }

    .toc a {
      color: #8b949e;
      text-decoration: none;
      font-size: 0.875rem;
      display: block;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s;
      border-left: 2px solid transparent;
    }

    .toc a:hover {
      color: #58a6ff;
      background: rgba(88,166,255,0.08);
      border-left-color: #58a6ff;
    }

    .toc a.active {
      color: #58a6ff;
      background: rgba(88,166,255,0.08);
      border-left-color: #58a6ff;
    }
  `,
  ],
})
export class TableOfContentsComponent {
  @Input() items: TocItem[] = [];
  @Output() itemClick = new EventEmitter<string>();

  readonly isOpen = signal<boolean>(false);
  readonly activeItem = signal<string | null>(null);

  toggle() {
    this.isOpen.update((open) => !open);
  }

  expand() {
    this.isOpen.set(true);
  }

  collapse() {
    this.isOpen.set(false);
  }

  onItemClick(event: Event, id: string) {
    event.preventDefault();
    this.activeItem.set(id);
    this.itemClick.emit(id);

    // Scroll to the heading
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setActiveItem(id: string) {
    this.activeItem.set(id);
  }
}
