# Demos

This application includes interactive demos showcasing both SQLite and DuckDB database integrations.

## Database Demos Menu

Access demos from the **Database Demos** section in the left sidebar.

### SQLite CRUD Demo

**Purpose**: Demonstrate transactional database operations

**Features**:
- User list with search and filtering
- Create new users with form validation
- Edit existing users
- Delete users with confirmation
- Statistics dashboard (total users, added today, email domains)
- Tab-based navigation

**Location**: Left sidebar → Database Demos → SQLite CRUD

**Backend API**:
- `getUsers` - List all users
- `createUser` - Create new user
- `updateUser` - Update existing user
- `deleteUser` - Delete user (with validation)
- `getUserStats` - Get user statistics

### DuckDB Analytics Demo

**Purpose**: Showcase analytical database capabilities

**Features**:
- KPI dashboard with 6 key metrics
- Recent orders table with search
- Category performance visualization
- Top products list
- Export functionality
- Real-time data refresh

**Location**: Left sidebar → Database Demos → DuckDB Analytics

**Backend API**:
- `getDashboardStats` - Get dashboard statistics
- `getProducts` - List all products
- `getOrders` - List all orders
- `getCategoryStats` - Get category performance

## Using the Demos

### SQLite CRUD Operations

1. **View Users**: Click "User List" tab to see all users
2. **Search**: Use the search box to filter by name or email
3. **Add User**: Click "Add User" tab, fill form, submit
4. **Edit User**: Click edit icon (✏️) on any user row
5. **Delete User**: Click delete icon (🗑️) and confirm

### DuckDB Analytics

1. **View KPIs**: Review the 6 metric cards at the top
2. **Search Orders**: Use the search box in Recent Orders section
3. **Category Analysis**: Review category performance cards
4. **Export Data**: Click "Export" button to download JSON

## Database Comparison

| Feature | SQLite Demo | DuckDB Demo |
|---------|-------------|-------------|
| **Purpose** | CRUD operations | Analytics |
| **Data Type** | User records | Products & Orders |
| **Operations** | Create, Read, Update, Delete | Read, Aggregate |
| **Performance** | Fast single-row ops | Fast aggregations |
| **UI Style** | Tab-based forms | Dashboard cards |

## Technical Details

### SQLite Implementation

```c
// Prepared statement for safe inserts
sqlite3_stmt* stmt = sqlite_prepare(sqlite,
    "INSERT INTO users (name, email, age) VALUES (?, ?, ?)");
sqlite_bind_text(stmt, 1, name);
sqlite_bind_text(stmt, 2, email);
sqlite_bind_int(stmt, 3, age);
sqlite_step_execute(stmt);
```

### DuckDB Implementation

```c
// Analytical query with aggregation
DuckDBResult result = duckdb_query(duckdb,
    "SELECT category, SUM(total) as revenue "
    "FROM orders GROUP BY category ORDER BY revenue DESC");
```

## Next Steps

1. Try creating a user in SQLite demo
2. Export data from DuckDB demo
3. Review the API Reference for endpoint details
4. Check the Integration Guides for implementation details
