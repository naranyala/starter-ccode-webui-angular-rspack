# API Reference

## Overview

This document describes the WebUI API endpoints exposed by the backend to the Angular frontend.

## Authentication Endpoints

### authLogin

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "username_or_email": "admin",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

### authRegister

Register new user account.

**Request:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

## User Endpoints

### getUsers

List all users with pagination.

**Request:**
```json
{
  "search": "",
  "page": 1,
  "pageSize": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "age": 28,
        "created_at": "2026-03-30T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### createUser

Create new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }
}
```

### updateUser

Update existing user.

**Request:**
```json
{
  "id": 1,
  "name": "Updated Name",
  "email": "updated@example.com",
  "age": 31
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

### deleteUser

Delete user (with validation).

**Request:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted"
}
```

### validateDeleteUser

Check if user can be safely deleted.

**Request:**
```json
{
  "id": 1
}
```

**Response (Can Delete):**
```json
{
  "success": true,
  "data": {
    "can_delete": true,
    "user_name": "John Doe"
  }
}
```

**Response (Cannot Delete):**
```json
{
  "success": true,
  "data": {
    "can_delete": false,
    "user_name": "John Doe",
    "dependency_table": "orders",
    "dependency_count": 3,
    "message": "This user has 3 associated orders"
  }
}
```

### getUserStats

Get user statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 100,
    "today_count": 5,
    "unique_domains": 20
  }
}
```

## Product Endpoints

### getProducts

List all products.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Laptop Pro 15",
      "description": "High-performance laptop",
      "price": 1299.99,
      "stock": 25,
      "category": "Electronics",
      "created_at": "2026-03-30T10:00:00Z"
    }
  ]
}
```

### getCategories

List all categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices",
      "color": "#3b82f6"
    }
  ]
}
```

## Order Endpoints

### getOrders

List all orders.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customer_name": "Alice Johnson",
      "customer_email": "alice@example.com",
      "product_name": "Laptop Pro 15",
      "quantity": 1,
      "total": 1299.99,
      "status": "delivered",
      "created_at": "2026-03-30T10:00:00Z"
    }
  ]
}
```

## Analytics Endpoints

### getDashboardStats

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_products": 45,
    "total_orders": 248,
    "total_revenue": 12450.00,
    "avg_order_value": 50.20,
    "pending_orders": 12,
    "low_stock_products": 5
  }
}
```

### getCategoryStats

Get category performance statistics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Electronics",
      "product_count": 15,
      "total_revenue": 4500.00,
      "percentage": 65
    }
  ]
}
```

## Utility Endpoints

### getDbInfo

Get database information.

**Response:**
```json
{
  "success": true,
  "data": {
    "database": "sqlite",
    "path": "data/app.db",
    "size": 102400,
    "wal_size": 32768
  }
}
```

### loadDemoData

Load demo/seed data.

**Response:**
```json
{
  "success": true,
  "message": "Demo data loaded"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Response Format Standard

All successful responses follow this pattern:

```json
{
  "success": true,
  "data": { ... }
}
```

Where `data` contains the endpoint-specific payload.
