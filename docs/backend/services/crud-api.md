# CRUD API

CRUD API handlers for frontend-backend communication.

## Overview

The CRUD API provides a bridge between the Angular frontend and SQLite backend, exposing database operations through WebUI bindings.

## API Handlers

### User Operations

| Function | JavaScript | Description |
|----------|------------|-------------|
| `handle_get_users` | `getUsers` | Fetch all users |
| `handle_create_user` | `createUser` | Create new user |
| `handle_update_user` | `updateUser` | Update existing user |
| `handle_delete_user` | `deleteUser` | Delete user |
| `handle_get_user_stats` | `getUserStats` | Get user statistics |

### Data Operations

| Function | JavaScript | Description |
|----------|------------|-------------|
| `handle_get_products` | `getProducts` | Fetch all products |
| `handle_get_categories` | `getCategories` | Fetch all categories |
| `handle_get_orders` | `getOrders` | Fetch all orders |

## Response Format

All handlers return JSON responses:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message"
}
```

## Usage

### Initialize

```c
#include "services/crud_api.h"

// After WebUI and SQLite are initialized
crud_api_init(webui, sqlite);
```

### Frontend (TypeScript)

```typescript
import { ApiService } from './core/api.service';

constructor(private api: ApiService) {}

// Fetch users
async loadUsers() {
  const users = await this.api.callOrThrow<User[]>('getUsers');
  console.log(users);
}

// Create user
async createUser(name: string, email: string, age: number) {
  await this.api.callOrThrow('createUser', [{
    name, email, age
  }]);
}

// Update user
async updateUser(id: number, data: Partial<User>) {
  await this.api.callOrThrow('updateUser', [{ id, ...data }]);
}

// Delete user
async deleteUser(id: number) {
  await this.api.callOrThrow('deleteUser', [id]);
}

// Get statistics
async getStats() {
  const stats = await this.api.callOrThrow<UserStats>('getUserStats');
  console.log(`Total: ${stats.total_users}`);
}
```

## User Interface

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: string;
}

interface UserStats {
  total_users: number;
  today_count: number;
  unique_domains: number;
}
```

## Related Documentation

- [SQLite Service](sqlite.md) - Database operations
- [WebUI Service](webui.md) - Window management
