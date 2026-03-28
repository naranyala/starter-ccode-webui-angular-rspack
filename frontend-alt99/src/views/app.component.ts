import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  provideLucideIcons,
  Home,
  Database,
  Table,
  FileText,
  Settings,
  Info,
  Terminal,
  Shield,
  Cpu,
  Layers,
  Zap,
  Box,
  Menu,
  X,
} from '../core/lucide-icons.provider';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  category: 'main' | 'support';
}

interface FeatureInfo {
  title: string;
  description: string;
  icon: any;
  color: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [...provideLucideIcons()],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  readonly icons = {
    Home,
    Database,
    Table,
    FileText,
    Settings,
    Info,
    Terminal,
    Shield,
    Cpu,
    Layers,
    Zap,
    Box,
    Menu,
    X,
  };

  // Menu structure reflecting the project features
  readonly menuItems: MenuItem[] = [
    // Main Features
    { id: 'home', label: 'Home', icon: Home, category: 'main' },
    { id: 'sqlite', label: 'SQLite CRUD', icon: Database, category: 'main' },
    { id: 'duckdb', label: 'DuckDB Analytics', icon: Layers, category: 'main' },
    { id: 'query-builder', label: 'Query Builder', icon: FileText, category: 'main' },
    { id: 'auth', label: 'Authentication', icon: Shield, category: 'main' },
    { id: 'devtools', label: 'DevTools', icon: Terminal, category: 'main' },
    
    // Support
    { id: 'services', label: 'Services', icon: Cpu, category: 'support' },
    { id: 'events', label: 'Event Bus', icon: Zap, category: 'support' },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'support' },
    { id: 'about', label: 'About', icon: Info, category: 'support' },
  ];

  mainMenus = computed(() => this.menuItems.filter(item => item.category === 'main'));
  supportMenus = computed(() => this.menuItems.filter(item => item.category === 'support'));

  activeView = signal<string>('home');
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);

  // Feature data for each view
  readonly featureData: Record<string, FeatureInfo> = {
    home: {
      title: 'Welcome to C + Angular WebUI',
      description: 'A full-stack desktop application with C backend and Angular frontend',
      icon: Home,
      color: '#3b82f6',
    },
    sqlite: {
      title: 'SQLite Database',
      description: 'Full CRUD operations with SQLite, including migrations and seed data',
      icon: Database,
      color: '#00b09b',
    },
    duckdb: {
      title: 'DuckDB Analytics',
      description: 'High-performance analytical queries with DuckDB integration',
      icon: Layers,
      color: '#96c93d',
    },
    'query-builder': {
      title: 'SQL Query Builder',
      description: 'Fluent API for building complex SQL queries programmatically',
      icon: FileText,
      color: '#f59e0b',
    },
    auth: {
      title: 'Authentication System',
      description: 'JWT-based authentication with password hashing and user management',
      icon: Shield,
      color: '#ef4444',
    },
    devtools: {
      title: 'Developer Tools',
      description: 'Debugging utilities, logging, and development helpers',
      icon: Terminal,
      color: '#8b5cf6',
    },
    services: {
      title: 'DI Services',
      description: '16+ dependency-injected services including Logger, Event, File, Timer, JSON, Hash, HTTP, Config',
      icon: Cpu,
      color: '#06b6d4',
    },
    events: {
      title: 'Event Bus',
      description: 'Pub/sub event system for decoupled communication between components',
      icon: Zap,
      color: '#eab308',
    },
    settings: {
      title: 'Settings',
      description: 'Application configuration and preferences',
      icon: Settings,
      color: '#64748b',
    },
    about: {
      title: 'About',
      description: 'Version information and credits',
      icon: Info,
      color: '#ec4899',
    },
  };

  getPageTitle(): string {
    return this.menuItems.find(item => item.id === this.activeView())?.label || 'Home';
  }

  getIcon(iconFn: any): any {
    return iconFn;
  }

  setActiveView(view: string): void {
    this.activeView.set(view);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  selectMenuItem(item: string): void {
    this.activeView.set(item);
    this.closeMobileMenu();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  getActiveFeature(): FeatureInfo {
    return this.featureData[this.activeView()] || this.featureData.home;
  }

  // Service list for the Services view
  readonly services = [
    { name: 'LoggerService', layer: 'Foundation', description: 'Logging with timestamps and levels' },
    { name: 'EventService', layer: 'Foundation', description: 'Pub/sub event bus' },
    { name: 'FileService', layer: 'Foundation', description: 'File system operations' },
    { name: 'TimerService', layer: 'Foundation', description: 'Timing and scheduling' },
    { name: 'JsonService', layer: 'Foundation', description: 'JSON parsing and generation' },
    { name: 'HashService', layer: 'Foundation', description: 'MD5, SHA1, SHA256, CRC32' },
    { name: 'ConfigService', layer: 'Dependent', description: 'Application configuration' },
    { name: 'HttpService', layer: 'Dependent', description: 'HTTP client' },
    { name: 'SQLiteService', layer: 'Database', description: 'SQLite database + migrations' },
    { name: 'DuckDBService', layer: 'Database', description: 'DuckDB database' },
    { name: 'SqlQueryBuilder', layer: 'Database', description: 'SQL query builder' },
    { name: 'DatabaseService', layer: 'Database', description: 'Database abstraction' },
    { name: 'AuthService', layer: 'Enterprise', description: 'JWT authentication' },
    { name: 'ErrorService', layer: 'Enterprise', description: 'Error tracking' },
    { name: 'UpdaterService', layer: 'Enterprise', description: 'Auto-updater' },
    { name: 'CrudApi', layer: 'Integration', description: 'CRUD API handlers' },
    { name: 'WebuiService', layer: 'High-level', description: 'WebUI window management' },
  ];

  // Database tables info
  readonly databaseTables = [
    { name: 'users', description: 'User accounts with name, email, age' },
    { name: 'categories', description: 'Product categories with color/icon' },
    { name: 'products', description: 'Products with price, stock, SKU' },
    { name: 'orders', description: 'Customer orders with status' },
    { name: 'order_items', description: 'Order line items' },
    { name: 'schema_migrations', description: 'Migration tracking' },
  ];

  // DuckDB features
  readonly duckdbFeatures = [
    { name: 'Columnar Storage', description: 'Optimized for analytical queries' },
    { name: 'Vectorized Execution', description: 'High-performance query processing' },
    { name: 'SQL Support', description: 'Full SQL with extensions' },
    { name: 'Parquet Support', description: 'Read/write Parquet files' },
  ];

  // Auth features
  readonly authFeatures = [
    { name: 'JWT Tokens', description: 'Secure token-based authentication' },
    { name: 'Password Hashing', description: 'SHA256 + salt for passwords' },
    { name: 'User Registration', description: 'Create new user accounts' },
    { name: 'User Login', description: 'Authenticate and get access token' },
  ];

  // Service layers for iteration
  readonly serviceLayers = ['Foundation', 'Dependent', 'Database', 'Enterprise', 'Integration', 'High-level'];
}
