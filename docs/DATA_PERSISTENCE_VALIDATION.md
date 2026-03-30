# Data Persistence & Validation Guide

**Version:** 1.0  
**Last Updated:** March 30, 2026

This guide explains how data persistence and deletion validation work in the SQLite and DuckDB integrations.

---

## Table of Contents

1. [Data Persistence](#data-persistence)
2. [Database Schema](#database-schema)
3. [Deletion Validation System](#deletion-validation-system)
4. [Foreign Key Constraints](#foreign-key-constraints)
5. [Soft Delete Option](#soft-delete-option)
6. [API Reference](#api-reference)
7. [Frontend Integration](#frontend-integration)

---

## Data Persistence

### SQLite Database Location

The SQLite database is stored in a **persistent file**:

```
Project Root/
└── data/
    └── app.db    # Persistent SQLite database
```

### Database Initialization

The database is initialized in `src/main.c`:

```c
SQLiteService* sqlite = sqlite_service_inject();

/* Open persistent database file */
if (sqlite_open(sqlite, "data/app.db")) {
    logger_log(logger, "INFO", "SQLite: Database opened successfully");
    
    /* Run migrations to create/update schema */
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
}
```

### Key Points

✅ **Data persists** across application restarts  
✅ **File-based storage** in `data/app.db`  
✅ **Automatic migrations** on first run  
✅ **Seed data** included for demo purposes  

---

## Database Schema

### Tables Overview

```
┌─────────────────┐     ┌─────────────────┐
│   categories    │     │     users       │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ name            │     │ name            │
│ description     │     │ email (UNIQUE)  │
│ color           │     │ age             │
│ icon            │     │ is_active       │
│ created_at      │     │ created_at      │
│ updated_at      │     │ updated_at      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    products     │     │     orders      │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ name            │     │ user_id (FK)    │
│ description     │     │ status          │
│ price           │     │ total_amount    │
│ stock           │     │ shipping_address│
│ category_id(FK) │     │ created_at      │
│ sku (UNIQUE)    │     │ updated_at      │
│ is_active       │     └────────┬────────┘
│ created_at      │              │
│ updated_at      │              │
└─────────────────┘              │
                                 ▼
                        ┌─────────────────┐
                        │   order_items   │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ order_id (FK)   │
                        │ product_id (FK) │
                        │ quantity        │
                        │ unit_price      │
                        │ subtotal        │
                        │ created_at      │
                        └─────────────────┘
```

### Foreign Key Relationships

| Table | Foreign Key | References | On Delete |
|-------|-------------|------------|-----------|
| products | category_id | categories(id) | SET NULL |
| orders | user_id | users(id) | CASCADE |
| order_items | order_id | orders(id) | CASCADE |
| order_items | product_id | products(id) | CASCADE |

---

## Deletion Validation System

### Overview

Before allowing a delete operation, the system validates that the deletion won't violate data integrity by checking for dependent records.

### Validation Flow

```
User clicks Delete
       ↓
Frontend calls validateDeleteUser(id)
       ↓
Backend checks for dependencies
       ↓
┌──────┴──────┐
│             │
Can Delete    Cannot Delete
│             │
↓             ↓
Show Confirm  Show Warning
Dialog        with reason
│
↓
User Confirms
│
↓
Execute Delete
```

### Validation Codes

```c
typedef enum {
    VALIDATION_OK = 0,              /* Safe to delete */
    VALIDATION_HAS_DEPENDENCIES,    /* Has dependent records */
    VALIDATION_NOT_FOUND,           /* Record doesn't exist */
    VALIDATION_ERROR,               /* System error */
    VALIDATION_SOFT_DELETE_ONLY     /* Must use soft delete */
} ValidationCode;
```

### Dependency Checking

**Example: Validating User Deletion**

```c
ValidationCode validate_user_delete(SQLiteService* sqlite, 
                                    int user_id, 
                                    DependencyInfo* info) {
    /* Check if user exists */
    if (!record_exists(sqlite, "users", user_id)) {
        return VALIDATION_NOT_FOUND;
    }

    /* Check for orders referencing this user */
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "SELECT COUNT(*) FROM orders WHERE user_id = %d", user_id);
    
    info->table = "orders";
    info->count = /* query result */;
    
    if (info->count > 0) {
        return VALIDATION_HAS_DEPENDENCIES;
    }
    
    return VALIDATION_OK;
}
```

---

## Foreign Key Constraints

### SQLite Foreign Keys

Foreign keys are **enforced** in SQLite:

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### ON DELETE Actions

| Action | Behavior |
|--------|----------|
| CASCADE | Delete dependent records automatically |
| SET NULL | Set foreign key to NULL |
| RESTRICT | Prevent deletion if dependencies exist |
| NO ACTION | Default - same as RESTRICT |

### Application-Level Validation

Even with database-level constraints, we add **application-level validation** for:

1. **Better error messages** - User-friendly explanations
2. **Pre-flight checks** - Before attempting delete
3. **Business logic** - Custom rules beyond FK constraints
4. **Audit logging** - Track deletion attempts

---

## Soft Delete Option

### What is Soft Delete?

Instead of permanently removing records, soft delete marks them as inactive:

```sql
UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 5;
```

### Benefits

- ✅ **Data recovery** - Can be restored
- ✅ **Audit trail** - Historical data preserved
- ✅ **Referential integrity** - No broken foreign keys
- ✅ **Compliance** - Meet data retention requirements

### Implementation

```c
/* Soft delete function */
bool soft_delete_record(SQLiteService* sqlite, 
                        const char* table, 
                        int id) {
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "UPDATE %s SET is_active = 0, updated_at = CURRENT_TIMESTAMP "
             "WHERE id = %d", table, id);
    return sqlite_execute(sqlite, sql);
}
```

### Querying Active Records

```sql
/* Only fetch active records */
SELECT * FROM users WHERE is_active = 1;

/* Include inactive in admin views */
SELECT * FROM users WHERE is_active = 1 OR is_active = 0;
```

---

## API Reference

### Backend Validation Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `validateDeleteUser` | POST | Check if user can be safely deleted |
| `deleteUser` | POST | Delete user (with validation) |
| `validateDeleteProduct` | POST | Check if product can be deleted |
| `deleteProduct` | POST | Delete product |
| `validateDeleteOrder` | POST | Check if order can be deleted |
| `deleteOrder` | POST | Delete order |

### Request/Response Format

**Validate Delete Request:**
```json
{
  "id": 5
}
```

**Validate Delete Response (Can Delete):**
```json
{
  "success": true,
  "data": {
    "can_delete": true,
    "user_name": "John Doe"
  }
}
```

**Validate Delete Response (Cannot Delete):**
```json
{
  "success": true,
  "data": {
    "can_delete": false,
    "user_name": "John Doe",
    "dependency_table": "orders",
    "dependency_count": 3,
    "message": "This user has 3 associated orders. Delete orders first."
  }
}
```

**Delete Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "deleted"
  }
}
```

**Delete Response (Error):**
```json
{
  "success": false,
  "error": "{\"has_dependencies\":true,\"table\":\"orders\",\"count\":3,\"message\":\"...\"}"
}
```

---

## Frontend Integration

### Delete Flow with Validation

```typescript
async confirmDelete(user: User): Promise<void> {
  // Step 1: Validate deletion
  const validation = await this.api.call('validateDeleteUser', [{ id: user.id }]);
  
  if (!validation.success) {
    this.notification.showError(validation.error);
    return;
  }
  
  // Step 2: Check for dependencies
  if (!validation.data?.can_delete) {
    const data = validation.data;
    this.notification.warning(
      `Cannot delete: ${data.dependency_count} ${data.dependency_table} reference this user`
    );
    return;
  }
  
  // Step 3: Confirm with user
  const userName = validation.data?.user_name || user.name;
  if (!confirm(`Delete "${userName}"? This cannot be undone.`)) {
    return;
  }

  // Step 4: Execute deletion
  await this.api.callOrThrow('deleteUser', [{ id: user.id }]);
  this.notification.showSuccess('User deleted');
  await this.loadUsers();
}
```

### UI Components

**Delete Button with Validation:**
```html
<button 
  class="action-btn btn-delete" 
  (click)="confirmDelete(user)" 
  title="Delete">
  <lucide-angular [img]="icons.Trash2" size="16"></lucide-angular>
</button>
```

**Warning Dialog:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Cannot Delete                        │
├─────────────────────────────────────────┤
│ This user has 3 associated orders.      │
│ Delete orders first or reassign them.   │
│                                         │
│                        [ OK ]           │
└─────────────────────────────────────────┘
```

**Confirmation Dialog:**
```
┌─────────────────────────────────────────┐
│ ❓ Confirm Delete                       │
├─────────────────────────────────────────┤
│ Are you sure you want to delete         │
│ "John Doe"?                             │
│                                         │
│ This action cannot be undone.           │
│                                         │
│           [ Cancel ]  [ Delete ]        │
└─────────────────────────────────────────┘
```

---

## Best Practices

### 1. Always Validate Before Delete

```typescript
// ✅ Good - Validate first
const validation = await validateDelete(id);
if (!validation.can_delete) return;

// ❌ Bad - Delete without validation
await delete(id);
```

### 2. Show User-Friendly Messages

```typescript
// ✅ Good - Clear message
`Cannot delete: 3 orders reference this user`

// ❌ Bad - Technical error
`FOREIGN KEY constraint failed`
```

### 3. Provide Alternative Actions

```typescript
// Instead of just "Cannot delete"
if (!canDelete) {
  showWarning('Cannot delete', {
    reason: 'Has dependent orders',
    alternatives: [
      'Delete associated orders first',
      'Reassign orders to another user',
      'Use soft delete to preserve history'
    ]
  });
}
```

### 4. Log Deletion Attempts

```c
if (logger) {
  logger_log(logger, "INFO", "Delete user id=%d validated: %s", 
            id, validation_code_to_string(validation));
}
```

### 5. Use Transactions for Complex Deletes

```c
sqlite_begin_transaction(sqlite);

/* Delete order items first */
sqlite_execute(sqlite, "DELETE FROM order_items WHERE order_id = 5");

/* Then delete order */
sqlite_execute(sqlite, "DELETE FROM orders WHERE id = 5");

sqlite_commit(sqlite);
```

---

## Testing

### Backend Validation Tests

```c
TEST(test_validate_user_delete_with_orders) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    /* Create user and order */
    sqlite_execute(sqlite, "INSERT INTO users (name, email) VALUES ('Test', 'test@test.com')");
    sqlite_execute(sqlite, "INSERT INTO orders (user_id, status) VALUES (1, 'pending')");
    
    /* Validate deletion */
    DependencyInfo info;
    ValidationCode result = validate_user_delete(sqlite, 1, &info);
    
    ASSERT_EQ(result, VALIDATION_HAS_DEPENDENCIES);
    ASSERT_EQ(info.count, 1);
    ASSERT_STREQ(info.table, "orders");
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}
```

### Frontend Validation Tests

```typescript
it('should prevent deletion when dependencies exist', async () => {
  apiSpy.call.and.resolveTo({
    success: true,
    data: { can_delete: false, dependency_count: 3, dependency_table: 'orders' }
  });

  await component.confirmDelete(testUser);
  
  expect(notificationSpy.warning).toHaveBeenCalled();
  expect(apiSpy.callOrThrow).not.toHaveBeenCalled();
});
```

---

## Troubleshooting

### Issue: "Database is locked"

**Solution:** Enable WAL mode for better concurrency:

```c
sqlite_open_wal(sqlite, "data/app.db");
```

### Issue: "FOREIGN KEY constraint failed"

**Solution:** Use validation endpoint before delete:

```typescript
const validation = await api.call('validateDeleteUser', [{ id }]);
if (!validation.data?.can_delete) {
  // Show warning instead of error
}
```

### Issue: Data not persisting

**Solution:** Check database file path:

```c
/* Use relative path from project root */
sqlite_open(sqlite, "data/app.db");

/* Or absolute path */
sqlite_open(sqlite, "/full/path/to/data/app.db");
```

---

## Related Documentation

- [SQLite CRUD Integration](./SQLITE_CRUD_INTEGRATION.md)
- [DuckDB CRUD Integration](./DUCKDB_CRUD_INTEGRATION.md)
- [Backend Services](./backend/services/)
- [Frontend Demos](./FRONTEND_DEMOS.md)

---

**Next Steps:**

1. Implement soft delete toggle in UI
2. Add bulk delete with validation
3. Create audit log for deletions
4. Add data export before delete
5. Implement undo delete feature
