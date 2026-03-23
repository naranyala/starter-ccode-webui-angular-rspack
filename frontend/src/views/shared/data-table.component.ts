import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'actions';
  sortable?: boolean;
  width?: string;
}

export interface TableAction {
  id: string;
  icon: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="Search..."
            [value]="searchQuery()"
            (input)="onSearch($event)">
          @if (searchQuery()) {
            <button class="clear-btn" (click)="clearSearch()">×</button>
          }
        </div>
        <div class="toolbar-actions">
          <button class="toolbar-btn" (click)="refresh.emit()">
            <span>🔄</span> Refresh
          </button>
          <button class="toolbar-btn primary" (click)="add.emit()">
            <span>+</span> Add New
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading data...</span>
        </div>
      } @else if (displayData().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <h3>No data found</h3>
          <p>{{ emptyMessage }}</p>
        </div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                @for (col of columns; track col.key) {
                  <th
                    [style.width]="col.width"
                    [class.sortable]="col.sortable"
                    (click)="col.sortable && toggleSort(col.key)">
                    {{ col.label }}
                    @if (col.sortable && sortKey() === col.key) {
                      <span class="sort-indicator">{{ sortDir() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                }
                @if (actions.length > 0) {
                  <th style="width: 120px">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of displayData(); track trackByFn ? trackByFn(row) : $index) {
                <tr [class.editing]="editingId() === getRowId(row)">
                  @for (col of columns; track col.key) {
                    <td>
                      @if (editingId() === getRowId(row) && col.type !== 'actions') {
                        <input
                          type="{{ col.type || 'text' }}"
                          class="edit-input"
                          [value]="getCellValue(row, col.key)"
                          (input)="updateCell($event, row, col.key)">
                      } @else {
                        {{ formatValue(row[col.key], col.type) }}
                      }
                    </td>
                  }
                  @if (actions.length > 0) {
                    <td class="actions-cell">
                      @for (action of actions; track action.id) {
                        <button
                          type="button"
                          class="action-btn"
                          [class]="action.id"
                          [title]="action.label"
                          (click)="handleAction(action.id, row)">
                          {{ action.icon }}
                        </button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (totalItems() > pageSize) {
        <div class="pagination">
          <span class="page-info">
            Showing {{ startIndex() + 1 }}-{{ endIndex() }} of {{ totalItems() }}
          </span>
          <div class="page-buttons">
            <button
              class="page-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)">
              ← Prev
            </button>
            @for (page of visiblePages(); track page) {
              <button
                class="page-btn"
                [class.active]="currentPage() === page"
                (click)="goToPage(page)">
                {{ page }}
              </button>
            }
            <button
              class="page-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)">
              Next →
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .data-table-container {
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid #334155;
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 0 0.75rem;
      width: 300px;
    }

    .search-icon {
      font-size: 0.875rem;
      margin-right: 0.5rem;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #e2e8f0;
      font-size: 0.875rem;
      padding: 0.625rem 0;
      outline: none;
    }

    .search-input::placeholder {
      color: #64748b;
    }

    .clear-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .clear-btn:hover {
      color: #94a3b8;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.75rem;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toolbar-btn:hover {
      background: #475569;
    }

    .toolbar-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .toolbar-btn.primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #334155;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 1rem 1.25rem;
      background: #0f172a;
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #334155;
    }

    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .data-table th.sortable:hover {
      color: #e2e8f0;
    }

    .sort-indicator {
      margin-left: 0.5rem;
      color: #3b82f6;
    }

    .data-table td {
      padding: 1rem 1.25rem;
      color: #e2e8f0;
      font-size: 0.875rem;
      border-bottom: 1px solid #334155;
    }

    .data-table tr:hover {
      background: #1e293b;
    }

    .data-table tr.editing {
      background: #1e293b;
    }

    .edit-input {
      width: 100%;
      padding: 0.5rem;
      background: #0f172a;
      border: 1px solid #3b82f6;
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 0.875rem;
    }

    .edit-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .action-btn.edit {
      background: #3b82f620;
      color: #3b82f6;
    }

    .action-btn.edit:hover {
      background: #3b82f6;
      color: white;
    }

    .action-btn.delete {
      background: #ef444420;
      color: #ef4444;
    }

    .action-btn.delete:hover {
      background: #ef4444;
      color: white;
    }

    .action-btn.view {
      background: #10b98120;
      color: #10b981;
    }

    .action-btn.view:hover {
      background: #10b981;
      color: white;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #0f172a;
      border-top: 1px solid #334155;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .page-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .page-btn {
      padding: 0.5rem 0.75rem;
      background: #334155;
      border: none;
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #475569;
    }

    .page-btn.active {
      background: #3b82f6;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class DataTableComponent<T extends Record<string, any>> {
  @Input() set data(value: T[]) {
    this._data.set(value);
  }
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No records to display';
  @Input() pageSize = 10;
  @Input() trackByFn?: (item: T) => any;
  @Input() idField = 'id';

  @Output() refresh = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() view = new EventEmitter<T>();

  private _data = signal<T[]>([]);

  searchQuery = signal('');
  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);
  editingId = signal<any>(null);

  displayData = computed(() => {
    let data = this._data();

    const search = this.searchQuery().toLowerCase();
    if (search) {
      data = data.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(search)
        )
      );
    }

    const sort = this.sortKey();
    if (sort) {
      data = [...data].sort((a, b) => {
        const aVal = a[sort];
        const bVal = b[sort];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.sortDir() === 'asc' ? cmp : -cmp;
      });
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  totalItems = computed(() => {
    const search = this.searchQuery().toLowerCase();
    if (search) {
      return this._data().filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(search)
        )
      ).length;
    }
    return this._data().length;
  });

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);

  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.totalItems()));

  visiblePages = computed(() => {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }
    return pages;
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getRowId(row: T): any {
    return row[this.idField];
  }

  getCellValue(row: T, key: string): string {
    return String(row[key] ?? '');
  }

  updateCell(event: Event, row: T, key: string): void {
    // Handle cell update - emit event or store locally
  }

  formatValue(value: any, type?: string): string {
    if (value === null || value === undefined) return '-';
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (type === 'number') {
      return Number(value).toLocaleString();
    }
    return String(value);
  }

  handleAction(actionId: string, row: T): void {
    switch (actionId) {
      case 'edit':
        this.edit.emit(row);
        break;
      case 'delete':
        this.delete.emit(row);
        break;
      case 'view':
        this.view.emit(row);
        break;
      default:
        break;
    }
  }
}