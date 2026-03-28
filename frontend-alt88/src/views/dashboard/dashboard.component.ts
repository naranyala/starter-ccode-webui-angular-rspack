/**
 * Dashboard Component
 *
 * Main dashboard with statistics and navigation to different data views
 */

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../core/logger.service';
import { ApiService } from '../../core/api.service';
import { DuckdbUsersComponent } from '../duckdb/duckdb-users.component';
import { DuckdbProductsComponent } from '../duckdb/duckdb-products.component';
import { DuckdbOrdersComponent } from '../duckdb/duckdb-orders.component';
import { DuckdbAnalyticsComponent } from '../duckdb/duckdb-analytics.component';

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

export type DatabaseType = 'sqlite' | 'duckdb';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DuckdbUsersComponent,
    DuckdbProductsComponent,
    DuckdbOrdersComponent,
    DuckdbAnalyticsComponent,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">{{ currentDbIcon() }}</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">{{ currentDbName() }} Admin</span>
            }
          </div>
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems(); track item.id) {
            <button
              class="nav-item"
              [class.active]="activeView() === item.id"
              (click)="onNavClick(item.id)"
              [attr.title]="sidebarCollapsed() ? item.label : ''"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </button>
          }
          
          @if (!sidebarCollapsed()) {
            <div class="db-switch-section">
              <div class="db-switch-label">Database</div>
              <div class="db-switch-buttons">
                <button 
                  class="db-switch-btn"
                  [class.active]="currentDb() === 'sqlite'"
                  (click)="switchDatabase('sqlite')"
                >
                  🗄️ SQLite
                </button>
                <button 
                  class="db-switch-btn"
                  [class.active]="currentDb() === 'duckdb'"
                  (click)="switchDatabase('duckdb')"
                >
                  🦆 DuckDB
                </button>
              </div>
            </div>
          } @else {
            <button class="nav-item" (click)="toggleDbMenu()" title="Switch Database">
              <span class="nav-icon">🔄</span>
            </button>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" (click)="toggleSidebar()" title="Toggle sidebar">
            <span class="nav-icon">{{ sidebarCollapsed() ? '→' : '←' }}</span>
            @if (!sidebarCollapsed()) {
              <span class="nav-label">Collapse</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <button class="menu-toggle" (click)="toggleSidebar()" title="Toggle menu">
              <span>☰</span>
            </button>
            <h1 class="page-title">{{ currentPageTitle() }}</h1>
          </div>
          <div class="header-right">
            <div class="header-stats">
              <div class="mini-stat">
                <span class="mini-stat-label">Database</span>
                <span class="mini-stat-value db-badge" [class.sqlite]="currentDb() === 'sqlite'" [class.duckdb]="currentDb() === 'duckdb'">
                  {{ currentDb().toUpperCase() }}
                </span>
              </div>
              <div class="mini-stat">
                <span class="mini-stat-label">Total Records</span>
                <span class="mini-stat-value">{{ stats().totalUsers + stats().totalProducts + stats().totalOrders }}</span>
              </div>
            </div>
            <button class="btn-refresh" (click)="loadDemoData()" title="Load Demo Data" [disabled]="isLoadingDemo()">
              <span class="btn-icon">🎲</span>
              <span>Demo Data</span>
            </button>
            <button class="btn-refresh" (click)="refreshAll()" title="Refresh all data">
              <span class="refresh-icon" [class.spinning]="isLoading()">🔄</span>
            </button>
          </div>
        </header>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card stat-primary">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalUsers | number }}</span>
              <span class="stat-label">Total Users</span>
            </div>
          </div>
          <div class="stat-card stat-success">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalProducts | number }}</span>
              <span class="stat-label">Products</span>
            </div>
          </div>
          <div class="stat-card stat-warning">
            <div class="stat-icon">🛒</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalOrders | number }}</span>
              <span class="stat-label">Orders</span>
            </div>
          </div>
          <div class="stat-card stat-info">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalRevenue | number:'1.2-2' }}</span>
              <span class="stat-label">Revenue</span>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="content-area">
          @if (activeView() === 'users') {
            <app-duckdb-users (statsChange)="onStatsUpdate($any($event))"></app-duckdb-users>
          } @else if (activeView() === 'products') {
            <app-duckdb-products (statsChange)="onStatsUpdate($any($event))"></app-duckdb-products>
          } @else if (activeView() === 'orders') {
            <app-duckdb-orders (statsChange)="onStatsUpdate($any($event))"></app-duckdb-orders>
          } @else if (activeView() === 'analytics') {
            <app-duckdb-analytics></app-duckdb-analytics>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: rgba(15, 23, 42, 0.95);
      border-right: 1px solid rgba(148, 163, 184, 0.1);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 32px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: 10px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }

    .nav-item:hover {
      background: rgba(59, 130, 246, 0.1);
      color: #fff;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #fff;
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
    }

    .db-switch-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }

    .db-switch-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      padding: 0 16px;
      margin-bottom: 8px;
    }

    .db-switch-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 12px;
    }

    .db-switch-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 8px;
      color: #94a3b8;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .db-switch-btn:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
    }

    .db-switch-btn.active {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }

    .nav-icon {
      font-size: 20px;
      width: 24px;
      text-align: center;
    }

    .nav-label {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #0f172a;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      background: rgba(15, 23, 42, 0.5);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .menu-toggle {
      display: none;
      padding: 8px 12px;
      background: rgba(148, 163, 184, 0.1);
      border: none;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      font-size: 20px;
    }

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #fff;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-stats {
      display: flex;
      gap: 16px;
    }

    .mini-stat {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .mini-stat-label {
      font-size: 12px;
      color: #64748b;
    }

    .mini-stat-value {
      font-size: 18px;
      font-weight: 600;
      color: #06b6d4;
    }

    .db-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px !important;
    }

    .db-badge.sqlite {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }

    .db-badge.duckdb {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .btn-refresh .btn-icon {
      font-size: 16px;
      margin-right: 4px;
    }

    .btn-refresh {
      padding: 10px 16px;
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      color: #60a5fa;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-refresh:hover {
      background: rgba(59, 130, 246, 0.3);
    }

    .refresh-icon.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 24px 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      transition: all 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .stat-icon {
      font-size: 40px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }

    .stat-primary .stat-icon { background: rgba(59, 130, 246, 0.2); }
    .stat-success .stat-icon { background: rgba(16, 185, 129, 0.2); }
    .stat-warning .stat-icon { background: rgba(245, 158, 11, 0.2); }
    .stat-info .stat-icon { background: rgba(6, 182, 212, 0.2); }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 0 32px 32px;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        z-index: 1000;
        transform: translateX(-100%);
      }

      .sidebar:not(.collapsed) {
        transform: translateX(0);
      }

      .menu-toggle {
        display: block;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        padding: 16px 20px;
      }

      .top-header {
        padding: 16px 20px;
      }

      .content-area {
        padding: 0 20px 20px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly api = inject(ApiService);

  sidebarCollapsed = signal(false);
  activeView = signal<'users' | 'products' | 'orders' | 'analytics'>('users');
  isLoading = signal(false);
  isLoadingDemo = signal(false);
  currentDb = signal<DatabaseType>('sqlite');
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingOrders: 0,
  });

  navItems = signal<NavItem[]>([
    { id: 'users', label: 'Users', icon: '👥', active: true },
    { id: 'products', label: 'Products', icon: '📦', active: false },
    { id: 'orders', label: 'Orders', icon: '🛒', active: false },
    { id: 'analytics', label: 'Analytics', icon: '📊', active: false },
  ]);

  currentPageTitle = signal('Users');

  currentDbIcon(): string {
    return this.currentDb() === 'sqlite' ? '🗄️' : '🦆';
  }

  currentDbName(): string {
    return this.currentDb() === 'sqlite' ? 'SQLite' : 'DuckDB';
  }

  switchDatabase(db: DatabaseType): void {
    this.currentDb.set(db);
    this.logger.info(`Switched to ${db.toUpperCase()} database`);
    this.loadDashboardStats();
  }

  toggleDbMenu(): void {
    this.currentDb.update(db => db === 'sqlite' ? 'duckdb' : 'sqlite');
    this.loadDashboardStats();
  }

  async loadDemoData(): Promise<void> {
    this.isLoadingDemo.set(true);
    try {
      await this.api.callOrThrow('loadDemoData', []);
      this.logger.info('Demo data loaded successfully');
      await this.loadDashboardStats();
    } catch (error) {
      this.logger.error('Failed to load demo data', error);
    } finally {
      this.isLoadingDemo.set(false);
    }
  }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  setActiveView(viewId: 'users' | 'products' | 'orders' | 'analytics'): void {
    this.activeView.set(viewId);
    this.currentPageTitle.set(viewId.charAt(0).toUpperCase() + viewId.slice(1));
    this.loadDashboardStats();
  }

  onNavClick(viewId: string): void {
    this.setActiveView(viewId as 'users' | 'products' | 'orders' | 'analytics');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  async loadDashboardStats(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Load stats from backend
      const [users, products, orders] = await Promise.all([
        this.api.callOrThrow<any[]>('getUsers').catch(() => []),
        this.api.callOrThrow<any[]>('getProducts').catch(() => []),
        this.api.callOrThrow<any[]>('getOrders').catch(() => []),
      ]);

      this.stats.set({
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        activeUsers: users.filter((u: any) => u.active !== false).length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
      });
    } catch (error) {
      this.logger.error('Failed to load dashboard stats', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onStatsUpdate(event: { type: string; count: number }): void {
    this.stats.update(stats => ({
      ...stats,
      [event.type]: event.count,
    }));
  }

  refreshAll(): void {
    this.loadDashboardStats();
  }
}
