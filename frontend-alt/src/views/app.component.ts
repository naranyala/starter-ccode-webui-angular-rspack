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
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [class.mobile-hidden]="drawerOpen()">
        <div class="app-identity">
          <div class="app-logo">
            <span class="logo-icon">🦆</span>
          </div>
          @if (!sidebarCollapsed()) {
            <div class="app-info">
              <h2 class="app-name">Select a Topic</h2>
              <p class="app-tagline">WebUI Dashboard</p>
            </div>
          }
        </div>

        @if (!sidebarCollapsed()) {
          <div class="search-section">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-input"
                placeholder="Fuzzy search topics..."
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
              />
              @if (searchQuery()) {
                <button class="search-clear" (click)="clearSearch()">
                  <span>✕</span>
                </button>
              }
            </div>
          </div>
        }

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
          @for (item of filteredMenuItems(); track item.id) {
            <button
              type="button"
              class="nav-item"
              [class.active]="activeTable() === item.id"
              (click)="selectMenuItem(item.id)"
              [title]="sidebarCollapsed() ? item.label : ''">
              <span class="nav-icon" [style.background]="item.color">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </button>
          }
          @if (filteredMenuItems().length === 0) {
            <div class="no-results">
              <span class="no-results-icon">🔍</span>
              <p>No topics found</p>
            </div>
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
            <button class="mobile-menu-btn mobile-only" (click)="openDrawer()">
              <span class="hamburger-icon"></span>
            </button>
            <div class="header-title-content">
              <h1>{{ getActiveTableLabel() }}</h1>
              <span class="table-badge">{{ activeTable() }}</span>
            </div>
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

      <!-- Mobile Sliding-Up Drawer -->
      <div class="drawer-backdrop mobile-only" [class.visible]="drawerOpen()" (click)="closeDrawer()"></div>
      <div class="drawer mobile-only" [class.open]="drawerOpen()">
        <div class="drawer-header">
          <div class="drawer-brand">
            <span class="drawer-icon">🗄️</span>
            <span class="drawer-title">DuckDB CRUD</span>
          </div>
          <button class="drawer-close" (click)="closeDrawer()">
            <span>✕</span>
          </button>
        </div>
        <nav class="drawer-nav">
          @for (item of filteredMenuItems(); track item.id) {
            <button
              type="button"
              class="drawer-item"
              [class.active]="activeTable() === item.id"
              (click)="selectMenuItem(item.id)">
              <span class="drawer-item-icon" [style.background]="item.color">{{ item.icon }}</span>
              <span class="drawer-item-label">{{ item.label }}</span>
              @if (activeTable() === item.id) {
                <span class="drawer-item-check">✓</span>
              }
            </button>
          }
          @if (filteredMenuItems().length === 0) {
            <div class="drawer-no-results">
              <span class="drawer-no-results-icon">🔍</span>
              <p>No topics found</p>
            </div>
          }
        </nav>
        <div class="drawer-footer">
          <div class="drawer-db-status">
            <span class="drawer-status-dot"></span>
            <span class="drawer-status-text">Database Connected</span>
          </div>
        </div>
      </div>
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

    /* App Identity Section */
    .app-identity {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1rem 1.25rem;
      border-bottom: 1px solid #334155;
    }

    .app-logo {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .logo-icon {
      font-size: 1.75rem;
    }

    .app-info {
      flex: 1;
      overflow: hidden;
    }

    .app-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
      letter-spacing: -0.025em;
    }

    .app-tagline {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.25rem 0 0;
      font-weight: 500;
    }

    /* Search Section */
    .search-section {
      padding: 1rem 1rem 0;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      font-size: 1rem;
      opacity: 0.5;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 2.25rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-input::placeholder {
      color: #64748b;
    }

    .search-clear {
      position: absolute;
      right: 0.5rem;
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 0.75rem;
      padding: 0;
    }

    .search-clear:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: #64748b;
    }

    .no-results-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .no-results p {
      font-size: 0.875rem;
      margin: 0;
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

    /* Mobile menu button (hamburger) */
    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      margin-right: 0.75rem;
    }

    .hamburger-icon {
      display: block;
      width: 24px;
      height: 2px;
      background: #e2e8f0;
      position: relative;
      border-radius: 2px;
    }

    .hamburger-icon::before,
    .hamburger-icon::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 2px;
      background: #e2e8f0;
      border-radius: 2px;
      left: 0;
    }

    .hamburger-icon::before {
      top: -7px;
    }

    .hamburger-icon::after {
      top: 7px;
    }

    .header-title-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Mobile-only utility class */
    .mobile-only {
      display: none;
    }

    /* Sidebar hidden on mobile when drawer is open */
    .sidebar.mobile-hidden {
      transform: translateX(-100%);
    }

    /* Drawer Backdrop */
    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 199;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .drawer-backdrop.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Sliding-Up Drawer */
    .drawer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      background: #1e293b;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      z-index: 200;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .drawer.open {
      transform: translateY(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #334155;
    }

    .drawer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .drawer-icon {
      font-size: 1.5rem;
    }

    .drawer-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .drawer-close {
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1.2rem;
    }

    .drawer-close:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .drawer-nav {
      flex: 1;
      padding: 1rem 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .drawer-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }

    .drawer-item:hover {
      background: #334155;
      color: #e2e8f0;
    }

    .drawer-item.active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .drawer-item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .drawer-item-label {
      flex: 1;
      font-size: 1rem;
      font-weight: 500;
    }

    .drawer-item-check {
      font-size: 1.2rem;
      opacity: 0.8;
    }

    .drawer-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #334155;
    }

    .drawer-db-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #0f172a;
      border-radius: 10px;
    }

    .drawer-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    .drawer-status-text {
      font-size: 0.875rem;
      color: #64748b;
    }

    .drawer-no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: #64748b;
    }

    .drawer-no-results-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .drawer-no-results p {
      font-size: 0.875rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .mobile-only {
        display: block;
      }

      .mobile-menu-btn {
        display: block;
      }

      .header-title {
        gap: 0;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .sidebar:not(.collapsed):not(.mobile-hidden) {
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
  drawerOpen = signal(false);
  activeTable = signal('users');
  searchQuery = signal('');

  menuItems: TableMenuItem[] = [
    { id: 'users', label: 'Users', icon: '👥', color: '#3b82f6' },
    { id: 'products', label: 'Products', icon: '📦', color: '#10b981' },
    { id: 'orders', label: 'Orders', icon: '🛒', color: '#f59e0b' },
    { id: 'categories', label: 'Categories', icon: '🏷️', color: '#8b5cf6' },
  ];

  get filteredMenuItems(): TableMenuItem[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.menuItems;
    }
    return this.menuItems.filter(item => {
      const label = item.label.toLowerCase();
      return this.fuzzyMatch(query, label);
    });
  }

  fuzzyMatch(query: string, text: string): boolean {
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === query.length;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  selectMenuItem(tableId: string): void {
    this.activeTable.set(tableId);
    this.closeDrawer();
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
