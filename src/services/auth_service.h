/* Auth Service - Authentication with JWT and password hashing */

#ifndef AUTH_SERVICE_H
#define AUTH_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <time.h>

/* User roles */
typedef enum {
    AUTH_ROLE_USER = 0,
    AUTH_ROLE_ADMIN = 1,
    AUTH_ROLE_SUPER_ADMIN = 2
} AuthRole;

/* User structure */
typedef struct {
    long long id;
    char* username;
    char* email;
    char* password_hash;  /* bcrypt hash */
    AuthRole role;
    int is_active;
    time_t created_at;
    time_t updated_at;
} AuthUser;

/* Token structure */
typedef struct {
    char* access_token;
    char* refresh_token;
    long long user_id;
    time_t expires_at;
    time_t refresh_expires_at;
} AuthToken;

/* Token validation result */
typedef struct {
    int is_valid;
    long long user_id;
    AuthRole role;
    char* error;
} AuthTokenValidation;

/* Login credentials */
typedef struct {
    const char* username_or_email;
    const char* password;
} AuthLoginCredentials;

/* Registration data */
typedef struct {
    const char* username;
    const char* email;
    const char* password;
} AuthRegisterData;

/* Auth configuration */
typedef struct {
    const char* secret_key;         /* JWT secret */
    const char* refresh_secret;     /* Refresh token secret */
    int access_token_expiry_sec;    /* Access token TTL (default: 3600) */
    int refresh_token_expiry_sec;   /* Refresh token TTL (default: 604800) */
    int min_password_length;        /* Minimum password length (default: 8) */
} AuthConfig;

typedef struct AuthService {
    DI_Service base;
    char* secret_key;
    char* refresh_secret;
    int access_token_expiry_sec;
    int refresh_token_expiry_sec;
    int min_password_length;
} AuthService;

/* Forward declarations for DI system */
DI_Error auth_service_provider(DI_Container* container, void** out_service);
void auth_service_destroy(DI_Service* service);

/* Accessor function */
AuthService* auth_service_inject(void);

/* ==================== Initialization ==================== */

/**
 * Initialize auth service with configuration
 * @param self Auth service instance
 * @param config Authentication configuration
 * @return 1 on success, 0 on failure
 */
int auth_init(AuthService* self, const AuthConfig* config);

/**
 * Initialize auth service with default configuration
 * @param self Auth service instance
 * @return 1 on success, 0 on failure
 */
int auth_init_default(AuthService* self);

/* ==================== Password Hashing ==================== */

/**
 * Hash a password using bcrypt
 * @param self Auth service instance
 * @param password Plain text password
 * @return Bcrypt hash (must be freed), or NULL on failure
 */
char* auth_hash_password(AuthService* self, const char* password);

/**
 * Verify a password against a hash
 * @param self Auth service instance
 * @param password Plain text password
 * @param hash Bcrypt hash to verify against
 * @return 1 if password matches, 0 otherwise
 */
int auth_verify_password(AuthService* self, const char* password, const char* hash);

/**
 * Validate password strength
 * @param self Auth service instance
 * @param password Password to validate
 * @param error Output error message (if any)
 * @return 1 if valid, 0 if invalid
 */
int auth_validate_password(AuthService* self, const char* password, char** error);

/* ==================== JWT Token Operations ==================== */

/**
 * Generate JWT access token
 * @param self Auth service instance
 * @param user_id User ID to encode in token
 * @param role User role
 * @return JWT token string (must be freed), or NULL on failure
 */
char* auth_generate_access_token(AuthService* self, long long user_id, AuthRole role);

/**
 * Generate JWT refresh token
 * @param self Auth service instance
 * @param user_id User ID to encode in token
 * @return Refresh token string (must be freed), or NULL on failure
 */
char* auth_generate_refresh_token(AuthService* self, long long user_id);

/**
 * Validate JWT token
 * @param self Auth service instance
 * @param token JWT token to validate
 * @return Token validation result
 */
AuthTokenValidation auth_validate_token(AuthService* self, const char* token);

/**
 * Extract user ID from token
 * @param self Auth service instance
 * @param token JWT token
 * @return User ID, or -1 if invalid
 */
long long auth_get_user_id_from_token(AuthService* self, const char* token);

/**
 * Get role name string
 * @param role Auth role
 * @return Role name string
 */
const char* auth_role_name(AuthRole role);

/* ==================== User Management ==================== */

/**
 * Register a new user
 * @param self Auth service instance
 * @param data Registration data
 * @param user Output user structure (must be freed with auth_free_user)
 * @param error Output error message (if any)
 * @return 1 on success, 0 on failure
 */
int auth_register(AuthService* self, const AuthRegisterData* data, AuthUser** user, char** error);

/**
 * Authenticate user with username/email and password
 * @param self Auth service instance
 * @param creds Login credentials
 * @param token Output token (must be freed with auth_free_token)
 * @param user Output user info (optional, must be freed)
 * @param error Output error message (if any)
 * @return 1 on success, 0 on failure
 */
int auth_login(AuthService* self, const AuthLoginCredentials* creds, AuthToken** token, AuthUser** user, char** error);

/**
 * Refresh access token using refresh token
 * @param self Auth service instance
 * @param refresh_token Refresh token
 * @param new_access_token Output new access token (must be freed)
 * @param error Output error message (if any)
 * @return 1 on success, 0 on failure
 */
int auth_refresh_token(AuthService* self, const char* refresh_token, char** new_access_token, char** error);

/**
 * Get user by ID
 * @param self Auth service instance
 * @param user_id User ID
 * @param user Output user structure (must be freed)
 * @return 1 if found, 0 if not found
 */
int auth_get_user_by_id(AuthService* self, long long user_id, AuthUser** user);

/**
 * Get user by username
 * @param self Auth service instance
 * @param username Username
 * @param user Output user structure (must be freed)
 * @return 1 if found, 0 if not found
 */
int auth_get_user_by_username(AuthService* self, const char* username, AuthUser** user);

/**
 * Get user by email
 * @param self Auth service instance
 * @param email Email address
 * @param user Output user structure (must be freed)
 * @return 1 if found, 0 if not found
 */
int auth_get_user_by_email(AuthService* self, const char* email, AuthUser** user);

/**
 * Update user password
 * @param self Auth service instance
 * @param user_id User ID
 * @param new_password New password
 * @param error Output error message (if any)
 * @return 1 on success, 0 on failure
 */
int auth_update_password(AuthService* self, long long user_id, const char* new_password, char** error);

/**
 * Update user role
 * @param self Auth service instance
 * @param user_id User ID
 * @param new_role New role
 * @return 1 on success, 0 on failure
 */
int auth_update_user_role(AuthService* self, long long user_id, AuthRole new_role);

/**
 * Deactivate user account
 * @param self Auth service instance
 * @param user_id User ID
 * @return 1 on success, 0 on failure
 */
int auth_deactivate_user(AuthService* self, long long user_id);

/**
 * Delete user account
 * @param self Auth service instance
 * @param user_id User ID
 * @return 1 on success, 0 on failure
 */
int auth_delete_user(AuthService* self, long long user_id);

/* ==================== Authorization ==================== */

/**
 * Check if user has required role
 * @param user_role User's role
 * @param required_role Required role
 * @return 1 if authorized, 0 otherwise
 */
int auth_has_role(AuthRole user_role, AuthRole required_role);

/**
 * Check if user has any of the specified roles
 * @param user_role User's role
 * @param roles Array of required roles
 * @param role_count Number of roles
 * @return 1 if authorized, 0 otherwise
 */
int auth_has_any_role(AuthRole user_role, const AuthRole* roles, int role_count);

/* ==================== Memory Management ==================== */

/**
 * Free user structure
 * @param user User to free
 */
void auth_free_user(AuthUser* user);

/**
 * Free token structure
 * @param token Token to free
 */
void auth_free_token(AuthToken* token);

/**
 * Free token validation result
 * @param result Validation result to free
 */
void auth_free_token_validation(AuthTokenValidation* result);

/* ==================== Session Management ==================== */

/**
 * Invalidate all tokens for a user (logout all devices)
 * @param self Auth service instance
 * @param user_id User ID
 * @return 1 on success, 0 on failure
 */
int auth_invalidate_user_sessions(AuthService* self, long long user_id);

/**
 * Check if user session is active
 * @param self Auth service instance
 * @param user_id User ID
 * @return 1 if active, 0 if not
 */
int auth_is_session_active(AuthService* self, long long user_id);

#endif /* AUTH_SERVICE_H */
