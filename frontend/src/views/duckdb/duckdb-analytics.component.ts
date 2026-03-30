/**
 * DuckDB Analytics Dashboard Component
 * 
 * Professional analytics dashboard showcasing DuckDB's OLAP capabilities
 * Features:
 * - Real-time analytics dashboard
 * - Advanced filtering and search
 * - Data visualization cards
 * - Export functionality
 * - Professional dark theme with DuckDB branding (orange/blue)
 */

import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Database, Search, Filter, Download, TrendingUp, Users, 
  DollarSign, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight,
  Calendar, Package, RefreshCw, X, Plus, Edit2, Trash2
} from 'lucide-angular';
import { LoggerService } from '../../core/logger.service';
import { ApiService } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  created_at: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  product_name: string;
  quantity: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  pending_orders: number;
  low_stock_products: number;
  revenue_change: number;
  orders_change: number;
}

export interface CategoryStats {
  category: string;
  product_count: number;
  total_revenue: number;
  percentage: number;
}

// ============================================================================
// Component
// ============================================================================

@Component({
  selector: 'app-duckdb-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="duckdb-dashboard">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-brand">
            <div class="logo-wrapper">
              <lucide-angular [img]="icons.Database" size="32" class="logo-icon"></lucide-angular>
            </div>
            <div class="header-text">
              <h1 class="page-title">DuckDB Analytics Dashboard</h1>
              <p class="page-subtitle">Real-time OLAP analytics and business intelligence</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" (click)="refreshData()">
              <lucide-angular [img]="icons.RefreshCw" size="16"></lucide-angular>
              Refresh
            </button>
            <button class="btn btn-primary" (click)="exportData()">
              <lucide-angular [img]="icons.Download" size="16"></lucide-angular>
              Export
            </button>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="spinner-large"></div>
          <span>Loading analytics data...</span>
        </div>
      }

      <!-- Main Dashboard Content -->
      @if (!loading()) {
        <div class="dashboard-content">
          
          <!-- KPI Cards Row -->
          <div class="kpi-grid">
            <!-- Total Revenue -->
            <div class="kpi-card kpi-revenue">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <lucide-angular [img]="icons.DollarSign" size="20"></lucide-angular>
                </div>
                @if (stats()?.revenue_change !== undefined) {
                  <div class="kpi-trend" [class.trend-up]="stats()!.revenue_change >= 0" [class.trend-down]="stats()!.revenue_change < 0">
                    <lucide-angular [img]="stats()!.revenue_change >= 0 ? icons.ArrowUpRight : icons.ArrowDownRight" size="16"></lucide-angular>
                    {{ Math.abs(stats()!.revenue_change) }}%
                  </div>
                }
              </div>
              <div class="kpi-value">{{ stats()?.total_revenue | currency }}</div>
              <div class="kpi-label">Total Revenue</div>
            </div>

            <!-- Total Orders -->
            <div class="kpi-card kpi-orders">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <lucide-angular [img]="icons.ShoppingCart" size="20"></lucide-angular>
                </div>
                @if (stats()?.orders_change !== undefined) {
                  <div class="kpi-trend" [class.trend-up]="stats()!.orders_change >= 0" [class.trend-down]="stats()!.orders_change < 0">
                    <lucide-angular [img]="stats()!.orders_change >= 0 ? icons.ArrowUpRight : icons.ArrowDownRight" size="16"></lucide-angular>
                    {{ Math.abs(stats()!.orders_change) }}%
                  </div>
                }
              </div>
              <div class="kpi-value">{{ stats()?.total_orders | number }}</div>
              <div class="kpi-label">Total Orders</div>
            </div>

            <!-- Total Products -->
            <div class="kpi-card kpi-products">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <lucide-angular [img]="icons.Package" size="20"></lucide-angular>
                </div>
              </div>
              <div class="kpi-value">{{ stats()?.total_products | number }}</div>
              <div class="kpi-label">Total Products</div>
            </div>

            <!-- Avg Order Value -->
            <div class="kpi-card kpi-avg">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <lucide-angular [img]="icons.TrendingUp" size="20"></lucide-angular>
                </div>
              </div>
              <div class="kpi-value">{{ stats()?.avg_order_value | currency:'symbol':'1.0-0' }}</div>
              <div class="kpi-label">Avg Order Value</div>
            </div>

            <!-- Pending Orders -->
            <div class="kpi-card kpi-pending">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <lucide-angular [img]="icons.Calendar" size="20"></lucide-angular>
                </div>
              </div>
              <div class="kpi-value">{{ stats()?.pending_orders | number }}</div>
              <div class="kpi-label">Pending Orders</div>
            </div>

            <!-- Low Stock Alert -->
            <div class="kpi-card kpi-alert">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <lucide-angular [img]="icons.Activity" size="20"></lucide-angular>
                </div>
              </div>
              <div class="kpi-value">{{ stats()?.low_stock_products | number }}</div>
              <div class="kpi-label">Low Stock Products</div>
            </div>
          </div>

          <!-- Main Content Grid -->
          <div class="content-grid">
            
            <!-- Recent Orders Table -->
            <div class="content-card card-large">
              <div class="card-header">
                <div class="card-title">
                  <lucide-angular [img]="icons.ShoppingCart" size="20"></lucide-angular>
                  Recent Orders
                </div>
                <div class="card-actions">
                  <div class="search-small">
                    <lucide-angular [img]="icons.Search" size="14" class="search-icon"></lucide-angular>
                    <input 
                      type="text" 
                      placeholder="Search orders..."
                      [(ngModel)]="orderSearch"
                      (ngModelChange)="filterOrders()"/>
                  </div>
                </div>
              </div>
              <div class="card-body">
                @if (filteredOrders().length === 0) {
                  <div class="empty-state-small">
                    <lucide-angular [img]="icons.ShoppingCart" size="32"></lucide-angular>
                    <span>No orders found</span>
                  </div>
                } @else {
                  <div class="table-container">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (order of filteredOrders(); track order.id) {
                          <tr class="data-row">
                            <td class="cell-id">#{{ order.id }}</td>
                            <td>
                              <div class="customer-cell">
                                <div class="avatar">{{ getInitials(order.customer_name) }}</div>
                                <div class="customer-info">
                                  <div class="customer-name">{{ order.customer_name }}</div>
                                  <div class="customer-email">{{ order.customer_email }}</div>
                                </div>
                              </div>
                            </td>
                            <td class="cell-product">{{ order.product_name }}</td>
                            <td>
                              <span class="quantity-badge">{{ order.quantity }}</span>
                            </td>
                            <td class="cell-total">{{ order.total | currency }}</td>
                            <td>
                              <span class="status-badge" [class]="'status-' + order.status">
                                {{ order.status | titlecase }}
                              </span>
                            </td>
                            <td class="cell-date">{{ formatDate(order.created_at) }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <!-- Category Analytics -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  <lucide-angular [img]="icons.TrendingUp" size="20"></lucide-angular>
                  Category Performance
                </div>
              </div>
              <div class="card-body">
                @if (categoryStats().length === 0) {
                  <div class="empty-state-small">
                    <lucide-angular [img]="icons.TrendingUp" size="32"></lucide-angular>
                    <span>No category data</span>
                  </div>
                } @else {
                  <div class="category-list">
                    @for (cat of categoryStats(); track cat.category) {
                      <div class="category-item">
                        <div class="category-info">
                          <span class="category-name">{{ cat.category }}</span>
                          <span class="category-count">{{ cat.product_count }} products</span>
                        </div>
                        <div class="category-stats">
                          <span class="category-revenue">{{ cat.total_revenue | currency }}</span>
                          <div class="progress-bar">
                            <div class="progress-fill" [style.width.%]="cat.percentage"></div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Products List -->
            <div class="content-card">
              <div class="card-header">
                <div class="card-title">
                  <lucide-angular [img]="icons.Package" size="20"></lucide-angular>
                  Top Products
                </div>
                <button class="btn-icon-sm" (click)="showAllProducts()">
                  <lucide-angular [img]="icons.Plus" size="16"></lucide-angular>
                </button>
              </div>
              <div class="card-body">
                @if (products().length === 0) {
                  <div class="empty-state-small">
                    <lucide-angular [img]="icons.Package" size="32"></lucide-angular>
                    <span>No products</span>
                  </div>
                } @else {
                  <div class="product-list">
                    @for (product of products().slice(0, 5); track product.id) {
                      <div class="product-item">
                        <div class="product-avatar">{{ getInitials(product.name) }}</div>
                        <div class="product-info">
                          <div class="product-name">{{ product.name }}</div>
                          <div class="product-category">{{ product.category }}</div>
                        </div>
                        <div class="product-price">{{ product.price | currency }}</div>
                        <span class="stock-indicator" [class.low]="product.stock < 10">
                          {{ product.stock }} in stock
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .duckdb-dashboard {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 32px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .page-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      color: #fff;
    }

    .page-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 4px 0 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .kpi-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .kpi-revenue .kpi-icon { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .kpi-orders .kpi-icon { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .kpi-products .kpi-icon { background: rgba(249, 115, 22, 0.2); color: #f97316; }
    .kpi-avg .kpi-icon { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
    .kpi-pending .kpi-icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .kpi-alert .kpi-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .trend-up {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    .trend-down {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .kpi-label {
      font-size: 13px;
      color: #94a3b8;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    .content-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    .card-large {
      grid-row: span 2;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .card-body {
      padding: 20px;
    }

    /* Search Small */
    .search-small {
      position: relative;
      width: 200px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }

    .search-small input {
      width: 100%;
      padding: 8px 10px 8px 32px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
    }

    .search-small input:focus {
      outline: none;
      border-color: #f97316;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .data-row {
      transition: background 0.2s;
    }

    .data-row:hover {
      background: rgba(249, 115, 22, 0.05);
    }

    .data-row td {
      padding: 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.05);
      color: #e2e8f0;
    }

    .cell-id {
      font-family: 'Fira Code', monospace;
      color: #f97316;
      font-weight: 600;
    }

    .customer-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .customer-name {
      font-weight: 500;
    }

    .customer-email {
      font-size: 12px;
      color: #64748b;
      font-family: 'Fira Code', monospace;
    }

    .cell-product {
      font-weight: 500;
    }

    .quantity-badge {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(249, 115, 22, 0.15);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #f97316;
    }

    .cell-total {
      font-weight: 700;
      color: #22c55e;
    }

    .cell-date {
      font-size: 13px;
      color: #94a3b8;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .status-processing { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .status-shipped { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
    .status-delivered { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .status-cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    /* Category List */
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-name {
      font-weight: 600;
      color: #fff;
    }

    .category-count {
      font-size: 12px;
      color: #94a3b8;
    }

    .category-stats {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .category-revenue {
      font-size: 14px;
      font-weight: 600;
      color: #22c55e;
    }

    .progress-bar {
      height: 6px;
      background: rgba(148, 163, 184, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f97316, #ea580c);
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    /* Product List */
    .product-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(15, 23, 42, 0.3);
      border-radius: 8px;
      transition: background 0.2s;
    }

    .product-item:hover {
      background: rgba(15, 23, 42, 0.5);
    }

    .product-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }

    .product-info {
      flex: 1;
    }

    .product-name {
      font-weight: 500;
      color: #fff;
    }

    .product-category {
      font-size: 12px;
      color: #94a3b8;
    }

    .product-price {
      font-weight: 700;
      color: #22c55e;
      margin-right: 12px;
    }

    .stock-indicator {
      font-size: 12px;
      color: #94a3b8;
    }

    .stock-indicator.low {
      color: #f59e0b;
      font-weight: 600;
    }

    /* Empty States */
    .empty-state-small {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .empty-state-small lucide-angular {
      margin-bottom: 12px;
      opacity: 0.5;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 1000;
    }

    .spinner-large {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(249, 115, 22, 0.2);
      border-top-color: #f97316;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
    }

    .btn-outline {
      background: transparent;
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }

    .btn-outline:hover {
      background: rgba(249, 115, 22, 0.1);
    }

    .btn-icon-sm {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon-sm:hover {
      background: rgba(148, 163, 184, 0.2);
      color: #fff;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .card-large {
        grid-row: auto;
      }

      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn {
        flex: 1;
      }
    }
  `]
})
export class DuckdbAnalyticsComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);

  readonly icons = { 
    Database, Search, Filter, Download, TrendingUp, Users, DollarSign, 
    ShoppingCart, Activity, ArrowUpRight, ArrowDownRight, Calendar, 
    Package, RefreshCw, X, Plus, Edit2, Trash2 
  };
  readonly Math = Math;

  // State
  readonly loading = signal(false);
  readonly stats = signal<DashboardStats | null>(null);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly filteredOrders = signal<Order[]>([]);
  readonly categoryStats = signal<CategoryStats[]>([]);

  // Search
  orderSearch = '';

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.loading.set(true);
    try {
      const [stats, products, orders] = await Promise.all([
        this.api.callOrThrow<DashboardStats>('get_dashboard_stats', []),
        this.api.callOrThrow<Product[]>('getProducts', []),
        this.api.callOrThrow<Order[]>('getOrders', []),
      ]);

      this.stats.set(stats);
      this.products.set(products);
      this.orders.set(orders);
      this.filteredOrders.set(orders);
      this.calculateCategoryStats();
    } catch (error) {
      this.logger.error('Failed to load dashboard data', error);
      this.notification.error('Failed to load analytics data');
    } finally {
      this.loading.set(false);
    }
  }

  calculateCategoryStats(): void {
    const products = this.products();
    const orders = this.orders();

    const categoryMap = new Map<string, { count: number; revenue: number }>();

    // Count products per category
    products.forEach(product => {
      const current = categoryMap.get(product.category) || { count: 0, revenue: 0 };
      categoryMap.set(product.category, {
        count: current.count + 1,
        revenue: current.revenue
      });
    });

    // Calculate revenue per category from orders
    orders.forEach(order => {
      // Simple heuristic: get category from product name match
      const product = products.find(p => order.product_name.includes(p.name));
      if (product) {
        const current = categoryMap.get(product.category) || { count: 0, revenue: 0 };
        categoryMap.set(product.category, {
          count: current.count,
          revenue: current.revenue + order.total
        });
      }
    });

    // Convert to array and calculate percentages
    const totalRevenue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.revenue, 0);
    
    const stats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      product_count: data.count,
      total_revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.total_revenue - a.total_revenue);

    this.categoryStats.set(stats);
  }

  filterOrders(): void {
    const query = this.orderSearch.toLowerCase();
    this.filteredOrders.set(
      this.orders().filter(order =>
        order.customer_name.toLowerCase().includes(query) ||
        order.product_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query)
      )
    );
  }

  async refreshData(): Promise<void> {
    await this.loadDashboardData();
    this.notification.success('Data refreshed');
  }

  exportData(): void {
    const data = {
      stats: this.stats(),
      products: this.products(),
      orders: this.orders(),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.notification.success('Data exported successfully');
  }

  showAllProducts(): void {
    this.notification.info('Product list feature coming soon');
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
