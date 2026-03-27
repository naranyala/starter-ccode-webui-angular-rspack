import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SqliteCrudComponent } from './sqlite/sqlite.component';

interface TableMenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SqliteCrudComponent],
  template: `
    <div class="app-container">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="brand">
            <span class="brand-icon">🗄️</span>
            @if (!sidebarCollapsed()) {
              <span class="brand-text">DuckDB CRUD</span>
            }
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span>{{ sidebarCollapsed() ? '→' : '←' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of menuItems; track item.id) {
            <button
              type="button"
              class="nav-item"
              [class.active]="activeTable() === item.id"
              (click)="setActiveTable(item.id)"
              [title]="sidebarCollapsed() ? item.label : ''">
              <span class="nav-icon" [style.background]="item.color">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </button>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="db-status">
            <span class="status-dot"></span>
            @if (!sidebarCollapsed()) {
              <span class="status-text">Database Connected</span>
            }
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="content-header">
          <div class="header-title">
            <h1>{{ getActiveTableLabel() }}</h1>
            <span class="table-badge">{{ activeTable() }}</span>
          </div>
          <div class="header-actions">
            <button class="action-btn refresh" (click)="refreshData()">
              <span>🔄</span> Refresh
            </button>
          </div>
        </header>

        <div class="content-body">
          @switch (activeTable()) {
            @case ('users') {
              <app-sqlite-crud />
            }
            @case ('products') {
              <div class="coming-soon">
                <span class="coming-icon">📦</span>
                <h2>Products Table</h2>
                <p>Product management coming soon...</p>
              </div>
            }
            @case ('orders') {
              <div class="coming-soon">
                <span class="coming-icon">🛒</span>
                <h2>Orders Table</h2>
                <p>Order management coming soon...</p>
              </div>
            }
            @case ('categories') {
              <div class="coming-soon">
                <span class="coming-icon">🏷️</span>
                <h2>Categories Table</h2>
                <p>Category management coming soon...</p>
              </div>
            }
            @default {
              <div class="coming-soon">
                <span class="coming-icon">📊</span>
                <h2>Select a Table</h2>
                <p>Choose a table from the sidebar to start managing data</p>
              </div>
            }
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .app-container {
      display: flex;
      height: 100%;
      background: #0f172a;
      color: #e2e8f0;
    }

    .sidebar {
      width: 260px;
      min-width: 260px;
      background: #1e293b;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #334155;
      transition: all 0.3s ease;
    }

    .sidebar.collapsed {
      width: 72px;
      min-width: 72px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #334155;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      font-size: 1.5rem;
    }

    .brand-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .collapse-btn {
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .collapse-btn:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: transparent;
      border: none;
      border-radius: 10px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .nav-item:hover {
      background: #334155;
      color: #e2e8f0;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .nav-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .nav-label {
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #334155;
    }

    .db-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #0f172a;
      border-radius: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    .status-text {
      font-size: 0.75rem;
      color: #64748b;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #f8fafc;
      margin: 0;
    }

    .table-badge {
      padding: 0.25rem 0.75rem;
      background: #334155;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn {
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

    .action-btn:hover {
      background: #475569;
    }

    .content-body {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: #64748b;
    }

    .coming-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .coming-soon h2 {
      font-size: 1.5rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .coming-soon p {
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
      }

      .sidebar:not(.collapsed) {
        transform: translateX(0);
      }

      .content-header {
        padding: 1rem;
      }

      .content-body {
        padding: 1rem;
      }
    }
  `]
})
export class AppComponent {
  sidebarCollapsed = signal(false);
  activeTable = signal('users');

  menuItems: TableMenuItem[] = [
    { id: 'users', label: 'Users', icon: '👥', color: '#3b82f6' },
    { id: 'products', label: 'Products', icon: '📦', color: '#10b981' },
    { id: 'orders', label: 'Orders', icon: '🛒', color: '#f59e0b' },
    { id: 'categories', label: 'Categories', icon: '🏷️', color: '#8b5cf6' },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  setActiveTable(tableId: string): void {
    this.activeTable.set(tableId);
  }

  getActiveTableLabel(): string {
    const item = this.menuItems.find(m => m.id === this.activeTable());
    return item?.label || 'Dashboard';
  }

  refreshData(): void {
    window.location.reload();
  }
}
