# Database Demos Guide

This document describes the interactive database demos available in the application.

## Available Demos

### DuckDB Demos

| Demo | Description | Features |
|------|-------------|----------|
| **Users** | User management CRUD | Create, Read, Update, Delete users |
| **Products** | Product catalog CRUD | Product inventory management |
| **Orders** | Order processing CRUD | Order lifecycle management |

### SQLite Demo

| Demo | Description | Features |
|------|-------------|----------|
| **SQLite CRUD** | SQLite database operations | Full CRUD with SQL queries |

## Usage Checklist

- [ ] **DuckDB Users Demo**
  - [ ] Add new user with name, email, role
  - [ ] View user list with pagination
  - [ ] Edit existing user details
  - [ ] Delete user with confirmation
  - [ ] Search/filter users

- [ ] **DuckDB Products Demo**
  - [ ] Add products with name, price, category
  - [ ] View product grid/list
  - [ ] Update stock levels
  - [ ] Delete products
  - [ ] Filter by category

- [ ] **DuckDB Orders Demo**
  - [ ] Create new order with line items
  - [ ] View order history
  - [ ] Update order status
  - [ ] Cancel orders
  - [ ] Calculate totals

- [ ] **SQLite CRUD Demo**
  - [ ] Execute raw SQL queries
  - [ ] Create tables
  - [ ] Insert/Update/Delete records
  - [ ] View query results

## API Endpoints

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## Switching Databases

The application supports both DuckDB and SQLite. To switch:

1. **DuckDB** - In-memory analytical database (default)
   - Best for: Analytics, aggregations, large datasets
   - No setup required

2. **SQLite** - File-based relational database
   - Best for: Persistent storage, ACID transactions
   - Data stored in `data/app.db`

## Demo Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   Angular UI    │────▶│   C Backend      │
│  (Dashboard)    │     │   (WebUI)        │
└─────────────────┘     └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ DuckDB   │ │ SQLite   │ │ Services │
              │ Service  │ │ Service  │ │ (Auth,   │
              │          │ │          │ │  Logger) │
              └──────────┘ └──────────┘ └──────────┘
```

## Troubleshooting

### "No data displayed"
- Check backend is running: `./build/main`
- Verify database service initialized
- Check browser console for errors

### "Operation failed"
- Verify database file permissions
- Check if database is locked by another process
- Review backend logs

### "Slow queries"
- DuckDB is optimized for analytical queries
- For transactional workloads, use SQLite
- Check query execution plans
