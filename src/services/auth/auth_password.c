/* Auth Service - Password Hashing and Validation */

#include "services/auth/auth_service.h"
#include "services/auth/auth_internal.h"
#include "services/hash_service.h"

/* Generate random salt */
char* auth_generate_salt(void) {
    static const char* chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    char* salt = malloc(17);
    if (!salt) return NULL;
    
    for (int i = 0; i < 16; i++) {
        salt[i] = chars[rand() % strlen(chars)];
    }
    salt[16] = '\0';
    return salt;
}

/* Simple password hashing using SHA256 + salt */
char* auth_simple_hash_password(const char* password, const char* salt) {
    HashService* hash = hash_service_inject();
    if (!hash) return NULL;
    
    char* data = malloc(strlen(password) + strlen(salt) + 1);
    sprintf(data, "%s%s", salt, password);
    
    char* hashed = hash_sha256_hex(data, strlen(data));
    free(data);
    
    if (!hashed) return NULL;
    
    /* Prepend salt */
    char* result = malloc(strlen(salt) + strlen(hashed) + 2);
    sprintf(result, "%s$%s", salt, hashed);
    free(hashed);
    
    return result;
}

/* Hash a password using salted SHA256 */
char* auth_hash_password(AuthService* self, const char* password) {
    if (!self || !password) return NULL;
    
    char* salt = auth_generate_salt();
    if (!salt) return NULL;
    
    char* hashed = auth_simple_hash_password(password, salt);
    free(salt);
    
    return hashed;
}

/* Verify a password against a hash */
int auth_verify_password(AuthService* self, const char* password, const char* hash) {
    if (!self || !password || !hash) return 0;
    
    /* Extract salt from stored hash */
    const char* dollar = strchr(hash, '$');
    if (!dollar) return 0;
    
    size_t salt_len = dollar - hash;
    char* salt = malloc(salt_len + 1);
    strncpy(salt, hash, salt_len);
    salt[salt_len] = '\0';
    
    /* Hash password with extracted salt */
    char* computed = auth_simple_hash_password(password, salt);
    free(salt);
    
    if (!computed) return 0;
    
    int match = (strcmp(computed, hash) == 0);
    free(computed);
    
    return match;
}

/* Validate password strength */
int auth_validate_password(AuthService* self, const char* password, char** error) {
    if (!self || !password) {
        if (error) *error = strdup("Password is required");
        return 0;
    }
    
    size_t len = strlen(password);
    
    if ((int)len < self->min_password_length) {
        if (error) {
            *error = malloc(100);
            snprintf(*error, 100, "Password must be at least %d characters", self->min_password_length);
        }
        return 0;
    }
    
    /* Check for uppercase, lowercase, number */
    int has_upper = 0, has_lower = 0, has_digit = 0;
    for (size_t i = 0; i < len; i++) {
        if (isupper(password[i])) has_upper = 1;
        else if (islower(password[i])) has_lower = 1;
        else if (isdigit(password[i])) has_digit = 1;
    }
    
    if (!has_upper || !has_lower || !has_digit) {
        if (error) {
            *error = strdup("Password must contain uppercase, lowercase, and a number");
        }
        return 0;
    }
    
    return 1;
}
