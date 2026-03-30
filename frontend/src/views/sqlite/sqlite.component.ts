/**
 * SQLite CRUD Component - Professional Edition
 * 
 * Production-ready CRUD operations for SQLite database
 * Features:
 * - Modern dark theme with SQLite branding (green)
 * - Statistics dashboard
 * - Tab-based navigation (List/Create)
 * - Search and filtering
 * - Inline edit/delete actions
 * - Form validation
 * - Loading states and notifications
 */

import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Database, Search, RefreshCw, Plus, Edit2, Trash2, Users, Mail, Hash } from 'lucide-angular';
import { LoggerService } from '../../core/logger.service';
import { ApiService } from '../../core/api.service';
import { NotificationService } from '../../core/notification.service';

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: string;
}

export interface UserStats {
  total_users: number;
  today_count: number;
  unique_domains: number;
}

export interface FormData {
  id?: number;
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-sqlite-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="sqlite-crud-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-brand">
            <div class="logo-wrapper">
              <lucide-angular [img]="icons.Database" size="32" class="logo-icon"></lucide-angular>
            </div>
            <div class="header-text">
              <h1 class="page-title">SQLite User Management</h1>
              <p class="page-subtitle">Transactional database operations with ACID compliance</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" (click)="loadUsers()">
              <lucide-angular [img]="icons.RefreshCw" size="16"></lucide-angular>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <!-- Statistics Dashboard -->
      @if (stats(); as s) {
      <div class="stats-grid">
        <div class="stat-card stat-primary">
          <div class="stat-icon-wrapper">
            <lucide-angular [img]="icons.Users" size="24"></lucide-angular>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ s.total_users | number }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon-wrapper">
            <lucide-angular [img]="icons.Plus" size="24"></lucide-angular>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ s.today_count | number }}</span>
            <span class="stat-label">Added Today</span>
          </div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon-wrapper">
            <lucide-angular [img]="icons.Mail" size="24"></lucide-angular>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ s.unique_domains | number }}</span>
            <span class="stat-label">Email Domains</span>
          </div>
        </div>
      </div>
      }

      <!-- Main Content Card -->
      <div class="content-card">
        <!-- Tabs -->
        <div class="tab-nav">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'list'"
            (click)="setActiveTab('list')">
            <lucide-angular [img]="icons.List" size="18"></lucide-angular>
            User List
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'create'"
            (click)="setActiveTab('create')">
            <lucide-angular [img]="icons.Plus" size="18"></lucide-angular>
            Add User
          </button>
        </div>

        <!-- Tab Content: List -->
        @if (activeTab() === 'list') {
        <div class="tab-panel">
          <!-- Toolbar -->
          <div class="toolbar">
            <div class="search-wrapper">
              <lucide-angular [img]="icons.Search" size="18" class="search-icon"></lucide-angular>
              <input 
                type="text" 
                class="search-input" 
                placeholder="Search by name or email..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch()"/>
              @if (searchQuery()) {
                <button class="clear-btn" (click)="clearSearch()">
                  <lucide-angular [img]="icons.X" size="14"></lucide-angular>
                </button>
              }
            </div>
            <div class="results-info">
              Showing {{ filteredUsers().length }} of {{ users().length }} users
            </div>
          </div>

          <!-- Loading State -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Loading users...</span>
            </div>
          }

          <!-- Empty State -->
          @if (!loading() && filteredUsers().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <lucide-angular [img]="icons.Users" size="48"></lucide-angular>
              </div>
              <h3>No Users Found</h3>
              <p>{{ searchQuery() ? 'No users match your search' : 'Get started by creating your first user' }}</p>
              @if (!searchQuery()) {
                <button class="btn btn-primary" (click)="setActiveTab('create')">
                  <lucide-angular [img]="icons.Plus" size="16"></lucide-angular>
                  Create User
                </button>
              }
            </div>
          }

          <!-- Data Table -->
          @if (!loading() && filteredUsers().length > 0) {
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-id">ID</th>
                    <th class="col-name">
                      <div class="th-content">
                        <lucide-angular [img]="icons.Users" size="16"></lucide-angular>
                        Name
                      </div>
                    </th>
                    <th class="col-email">
                      <div class="th-content">
                        <lucide-angular [img]="icons.Mail" size="16"></lucide-angular>
                        Email
                      </div>
                    </th>
                    <th class="col-age">
                      <div class="th-content">
                        <lucide-angular [img]="icons.Hash" size="16"></lucide-angular>
                        Age
                      </div>
                    </th>
                    <th class="col-created">Created At</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of filteredUsers(); track user.id) {
                    <tr class="data-row">
                      <td class="cell-id">#{{ user.id }}</td>
                      <td>
                        <div class="user-cell">
                          <div class="avatar">{{ getInitials(user.name) }}</div>
                          <span class="user-name">{{ user.name }}</span>
                        </div>
                      </td>
                      <td class="cell-email">{{ user.email }}</td>
                      <td class="cell-age">{{ user.age }}</td>
                      <td class="cell-date">{{ formatDate(user.created_at) }}</td>
                      <td class="cell-actions">
                        <button class="action-btn btn-edit" (click)="openEditModal(user)" title="Edit">
                          <lucide-angular [img]="icons.Edit2" size="16"></lucide-angular>
                        </button>
                        <button class="action-btn btn-delete" (click)="confirmDelete(user)" title="Delete">
                          <lucide-angular [img]="icons.Trash2" size="16"></lucide-angular>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
        }

        <!-- Tab Content: Create/Edit -->
        @if (activeTab() === 'create') {
        <div class="tab-panel">
          <form class="form-container" (ngSubmit)="submitForm()">
            <div class="form-header">
              <h2>{{ isEditing() ? 'Edit User' : 'Create New User' }}</h2>
              <p>Fill in the information below to {{ isEditing() ? 'update' : 'create' }} a user account.</p>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">
                  <lucide-angular [img]="icons.Users" size="16"></lucide-angular>
                  Full Name
                </label>
                <input 
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  placeholder="John Doe"/>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <lucide-angular [img]="icons.Mail" size="16"></lucide-angular>
                  Email Address
                </label>
                <input 
                  type="email" 
                  class="form-input" 
                  [(ngModel)]="formData.email"
                  name="email"
                  required
                  placeholder="john@example.com"/>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <lucide-angular [img]="icons.Hash" size="16"></lucide-angular>
                  Age
                </label>
                <input 
                  type="number" 
                  class="form-input" 
                  [(ngModel)]="formData.age"
                  name="age"
                  required
                  min="1"
                  max="150"
                  placeholder="25"/>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="cancelForm()">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="spinner-small"></span>
                  {{ isEditing() ? 'Updating...' : 'Creating...' }}
                } @else {
                  <lucide-angular [img]="icons.Plus" size="16"></lucide-angular>
                  {{ isEditing() ? 'Update User' : 'Create User' }}
                }
              </button>
            </div>
          </form>
        </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sqlite-crud-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 24px;
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
      background: linear-gradient(135deg, #10b981, #059669);
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .stat-primary .stat-icon-wrapper { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .stat-success .stat-icon-wrapper { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .stat-info .stat-icon-wrapper { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Content Card */
    .content-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    /* Tabs */
    .tab-nav {
      display: flex;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }

    .tab-btn:hover {
      color: #fff;
      background: rgba(148, 163, 184, 0.05);
    }

    .tab-btn.active {
      color: #10b981;
      border-bottom-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }

    /* Tab Panel */
    .tab-panel {
      padding: 24px;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px 10px 40px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #10b981;
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }

    .clear-btn:hover {
      color: #fff;
    }

    .results-info {
      font-size: 13px;
      color: #94a3b8;
      white-space: nowrap;
    }

    /* Loading & Empty States */
    .loading-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(148, 163, 184, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      color: #64748b;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 18px;
      margin: 0 0 8px;
      color: #fff;
    }

    .empty-state p {
      color: #94a3b8;
      margin: 0 0 20px;
    }

    /* Data Table */
    .data-table-wrapper {
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

    .th-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .data-row {
      transition: background 0.2s;
    }

    .data-row:hover {
      background: rgba(16, 185, 129, 0.05);
    }

    .data-row td {
      padding: 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.05);
      color: #e2e8f0;
    }

    .col-id { width: 80px; }
    .col-name { width: 200px; }
    .col-email { width: 250px; }
    .col-age { width: 80px; }
    .col-created { width: 150px; }
    .col-actions { width: 100px; text-align: right; }

    .cell-id {
      font-family: 'Fira Code', monospace;
      color: #64748b;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 500;
    }

    .cell-email {
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      color: #3b82f6;
    }

    .cell-date {
      font-size: 13px;
      color: #94a3b8;
    }

    .cell-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-edit {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    .btn-edit:hover {
      background: rgba(59, 130, 246, 0.25);
    }

    .btn-delete {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.25);
    }

    /* Form */
    .form-container {
      max-width: 600px;
    }

    .form-header {
      margin-bottom: 24px;
    }

    .form-header h2 {
      font-size: 20px;
      margin: 0 0 8px;
      color: #fff;
    }

    .form-header p {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }

    .form-grid {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
    }

    .form-input {
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
    }

    .form-input:focus {
      outline: none;
      border-color: #10b981;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
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
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-secondary {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(148, 163, 184, 0.2);
      color: #fff;
    }

    .btn-outline {
      background: transparent;
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .btn-outline:hover {
      background: rgba(16, 185, 129, 0.1);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-wrapper {
        max-width: none;
      }

      .data-table-wrapper {
        overflow-x: auto;
      }

      .data-table {
        min-width: 800px;
      }
    }
  `]
})
export class SqliteCrudComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);

  readonly icons = { Database, Search, RefreshCw, Plus, Edit2, Trash2, Users, Mail, Hash, List, X };

  // State
  readonly activeTab = signal<'list' | 'create'>('list');
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly isEditing = signal(false);

  // Data
  readonly users = signal<User[]>([]);
  readonly filteredUsers = signal<User[]>([]);
  readonly stats = signal<UserStats | null>(null);
  readonly searchQuery = signal('');

  // Form
  readonly formData = signal<FormData>({ name: '', email: '', age: 25 });

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    try {
      const [users, stats] = await Promise.all([
        this.api.callOrThrow<User[]>('getUsers'),
        this.api.callOrThrow<UserStats>('getUserStats'),
      ]);
      this.users.set(users);
      this.stats.set(stats);
      this.filterUsers();
    } catch (error) {
      this.logger.error('Failed to load users', error);
      this.notification.showError('Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  setActiveTab(tab: 'list' | 'create'): void {
    this.activeTab.set(tab);
    if (tab === 'create') {
      this.resetForm();
    }
  }

  onSearch(): void {
    this.filterUsers();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.filterUsers();
  }

  filterUsers(): void {
    const query = this.searchQuery().toLowerCase();
    this.filteredUsers.set(
      this.users().filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    );
  }

  openEditModal(user: User): void {
    this.isEditing.set(true);
    this.formData.set({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age
    });
    this.activeTab.set('create');
  }

  cancelForm(): void {
    this.resetForm();
    this.activeTab.set('list');
  }

  resetForm(): void {
    this.isEditing.set(false);
    this.formData.set({ name: '', email: '', age: 25 });
  }

  async submitForm(): Promise<void> {
    if (!this.formData().name || !this.formData().email || !this.formData().age) {
      this.notification.showError('Please fill in all fields');
      return;
    }

    this.submitting.set(true);
    try {
      if (this.isEditing()) {
        await this.api.callOrThrow('updateUser', [this.formData()]);
        this.notification.showSuccess('User updated successfully');
      } else {
        await this.api.callOrThrow('createUser', [this.formData()]);
        this.notification.showSuccess('User created successfully');
      }
      this.resetForm();
      await this.loadUsers();
    } catch (error) {
      this.logger.error('Failed to save user', error);
      this.notification.showError('Failed to save user');
    } finally {
      this.submitting.set(false);
    }
  }

  async confirmDelete(user: User): Promise<void> {
    // First validate the deletion
    this.loading.set(true);
    try {
      const validation = await this.api.call('validateDeleteUser', [{ id: user.id }]);
      
      if (!validation.success) {
        this.notification.showError(validation.error || 'Cannot delete user');
        return;
      }
      
      // Check if there are dependencies
      if (!validation.data?.can_delete) {
        const data = validation.data;
        const message = data.message || `Cannot delete: ${data.dependency_count} ${data.dependency_table} reference this user`;
        this.notification.warning(message);
        return;
      }
      
      // Safe to delete - confirm with user
      const userName = validation.data?.user_name || user.name;
      if (!confirm(`Are you sure you want to delete "${userName}"?\n\nThis action cannot be undone.`)) {
        return;
      }

      // Proceed with deletion
      await this.api.callOrThrow('deleteUser', [user.id]);
      this.notification.showSuccess('User deleted successfully');
      await this.loadUsers();
    } catch (error) {
      this.logger.error('Failed to delete user', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete user';
      this.notification.showError(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
