# Auth Service

JWT authentication with password hashing.

## Overview

AuthService provides user authentication with:
- JWT token generation/validation
- Password hashing (SHA256 + salt)
- Password strength validation
- User registration/login
- Session management

## API

### Authentication

| Function | Description |
|----------|-------------|
| `auth_service_inject()` | Get auth service instance |
| `auth_register(AuthService*, username, email, password)` | Register user |
| `auth_login(AuthService*, email, password)` | Login user |
| `auth_validate_token(AuthService*, token)` | Validate JWT token |
| `auth_logout(AuthService*, token)` | Logout user |

### Token Operations

| Function | Description |
|----------|-------------|
| `auth_generate_token(AuthService*, user_id)` | Generate JWT |
| `auth_hash_password(AuthService*, password)` | Hash password |
| `auth_verify_password(AuthService*, hash, password)` | Verify password |

## Usage

```c
#include "services/auth_service.h"

// Get service
AuthService* auth = auth_service_inject();

// Register user
const char* error = NULL;
if (!auth_register(auth, "john", "john@example.com", "password123", &error)) {
    printf("Registration failed: %s\n", error);
}

// Login
AuthToken* token = NULL;
if (auth_login(auth, "john@example.com", "password123", &token)) {
    printf("Token: %s\n", token->access_token);
}

// Validate token
if (auth_validate_token(auth, token->access_token)) {
    printf("Token is valid\n");
}
```

## Token Structure

```c
typedef struct {
    char* access_token;      // JWT token
    char* token_type;      // "Bearer"
    int expires_in;        // Expiry in seconds
    int user_id;           // User ID
} AuthToken;
```

## Security

- Passwords hashed with SHA256 + random salt
- JWT tokens with configurable expiry
- Secure password comparison (constant-time)

## Related Documentation

- [Hash Service](hash.md) - Cryptographic hashing
- [SQLite Service](sqlite.md) - User storage
