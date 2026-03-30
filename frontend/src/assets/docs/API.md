# API Reference

## Frontend API Service

### ApiService

The main service for communicating with the C backend.

```typescript
import { ApiService } from './core/api.service';

constructor(private api: ApiService) {}
```

### Methods

#### callOrThrow<T>(method: string, data?: any): Promise<T>

Call a backend method and return typed response.

```typescript
// Get users
const users = await this.api.callOrThrow<User[]>('getUsers');

// Get single user
const user = await this.api.callOrThrow<User>('getUser', { id: 1 });

// Create user
const newUser = await this.api.callOrThrow<User>('createUser', {
  name: 'John',
  email: 'john@example.com'
});
```

#### call<T>(method: string, data?: any): Promise<T | null>

Call backend method, returns null on error instead of throwing.

```typescript
const result = await this.api.call<User[]>('getUsers');
if (result) {
  console.log(result);
} else {
  console.log('Call failed');
}
```

## Backend API Methods

### User Operations

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getUsers` | - | `User[]` | Get all users |
| `getUser` | `{ id: number }` | `User` | Get user by ID |
| `createUser` | `{ name, email, age }` | `User` | Create new user |
| `updateUser` | `{ id, ...fields }` | `User` | Update user |
| `deleteUser` | `{ id: number }` | `boolean` | Delete user |

### Authentication

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `register` | `{ email, password, name? }` | `AuthResult` | Register user |
| `login` | `{ email, password }` | `AuthResult` | Login user |
| `verifyToken` | `{ token }` | `boolean` | Verify JWT |

### Database

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `query` | `{ sql, params? }` | `QueryResult` | Execute SQL |
| `getTables` | - | `string[]` | List tables |

## Data Types

### User
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: string;
}
```

### AuthResult
```typescript
interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
```

### QueryResult
```typescript
interface QueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  error?: string;
}
```

## Error Handling

```typescript
try {
  const users = await this.api.callOrThrow<User[]>('getUsers');
} catch (error) {
  console.error('Failed to get users:', error.message);
}
```

## Events

The API service also emits events for real-time updates:

```typescript
this.api.on('user:created', (user: User) => {
  console.log('New user:', user);
});
```
