import { Component, signal, inject, type OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, type TableColumn, type TableAction } from '../shared/data-table.component';
import { LoggerService } from '../../core/logger.service';
import { NotificationService } from '../../core/notification.service';
import { ApiService } from '../../core/api.service';

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

@Component({
  selector: 'app-sqlite-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  template: `
    <div class="crud-wrapper">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: #3b82f6;">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().total_users }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #10b981;">📅</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().today_count }}</span>
            <span class="stat-label">Added Today</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #8b5cf6;">🌐</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().unique_domains }}</span>
            <span class="stat-label">Email Domains</span>
          </div>
        </div>
      </div>

      @if (showForm()) {
        <div class="form-modal">
          <div class="form-container">
            <div class="form-header">
              <h2>{{ editingUser() ? 'Edit User' : 'Add New User' }}</h2>
              <button class="close-btn" (click)="closeForm()">×</button>
            </div>
            <form class="crud-form" (ngSubmit)="saveUser()">
              <div class="form-row">
                <div class="form-group">
                  <label>Name</label>
                  <input type="text" [(ngModel)]="formData.name" name="name" required placeholder="Enter name">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="formData.email" name="email" required placeholder="Enter email">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Age</label>
                  <input type="number" [(ngModel)]="formData.age" name="age" required min="1" max="150" placeholder="Enter age">
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-cancel" (click)="closeForm()">Cancel</button>
                <button type="submit" class="btn-submit" [disabled]="isLoading()">
                  {{ isLoading() ? 'Saving...' : (editingUser() ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <app-data-table
        [data]="users()"
        [columns]="columns"
        [actions]="actions"
        [loading]="isLoading()"
        emptyMessage="No users found. Add a new user to get started."
        (refresh)="loadUsers()"
        (add)="openAddForm()"
        (edit)="openEditForm($event)"
        (delete)="confirmDelete($event)" />
    </div>
  `,
  styles: [`
    .crud-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .form-container {
      background: #1e293b;
      border-radius: 16px;
      border: 1px solid #334155;
      width: 100%;
      max-width: 500px;
      overflow: hidden;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }

    .form-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #f8fafc;
    }

    .close-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: #e2e8f0;
    }

    .crud-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
    }

    .form-group input {
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .form-group input::placeholder {
      color: #64748b;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .btn-cancel {
      padding: 0.75rem 1.25rem;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #475569;
    }

    .btn-submit {
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class SqliteCrudComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(ApiService);

  isLoading = signal(false);
  stats = signal<UserStats>({ total_users: 0, today_count: 0, unique_domains: 0 });
  users = signal<User[]>([]);
  showForm = signal(false);
  editingUser = signal<User | null>(null);

  formData: Partial<User> = { name: '', email: '', age: 25 };

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', type: 'email', sortable: true },
    { key: 'age', label: 'Age', type: 'number', sortable: true, width: '100px' },
    { key: 'created_at', label: 'Created', type: 'date', sortable: true, width: '150px' },
  ];

  actions: TableAction[] = [
    { id: 'edit', icon: '✏️', label: 'Edit', color: '#3b82f6' },
    { id: 'delete', icon: '🗑️', label: 'Delete', color: '#ef4444' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [users, stats] = await Promise.all([
        this.api.callOrThrow<User[]>('getUsers'),
        this.api.callOrThrow<UserStats>('getUserStats'),
      ]);
      this.users.set(users);
      this.stats.set(stats);
    } catch (error) {
      this.notifications.error('Failed to load users');
      this.logger.error('Load users error', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddForm(): void {
    this.editingUser.set(null);
    this.formData = { name: '', email: '', age: 25 };
    this.showForm.set(true);
  }

  openEditForm(user: User): void {
    this.editingUser.set(user);
    this.formData = { ...user };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
    this.formData = { name: '', email: '', age: 25 };
  }

  async saveUser(): Promise<void> {
    if (!this.formData.name || !this.formData.email || !this.formData.age) {
      this.notifications.error('Please fill in all fields');
      return;
    }

    const isEdit = this.editingUser() !== null;
    this.isLoading.set(true);
    try {
      if (isEdit) {
        await this.api.callOrThrow('updateUser', [this.formData]);
        this.notifications.success('User updated successfully');
      } else {
        await this.api.callOrThrow('createUser', [this.formData]);
        this.notifications.success('User created successfully');
      }
      this.closeForm();
      await this.loadUsers();
    } catch (error) {
      this.notifications.error(isEdit ? 'Failed to update user' : 'Failed to create user');
      this.logger.error('Save user error', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  confirmDelete(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.deleteUser(user);
    }
  }

  async deleteUser(user: User): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.api.callOrThrow('deleteUser', [user.id]);
      this.notifications.success('User deleted');
      await this.loadUsers();
    } catch (error) {
      this.notifications.error('Failed to delete user');
      this.logger.error('Delete user error', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}