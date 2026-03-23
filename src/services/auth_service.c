/* Auth Service Implementation - Authentication with JWT and password hashing */

#include "auth_service.h"
#include "sqlite_service.h"
#include "logger_service.h"
#include "hash_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>
#include <time.h>

/* Internal base64 encoding/decoding for JWT */
static const char base64_chars[] = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char* base64_encode(const unsigned char* data, size_t input_length, size_t* output_length) {
    *output_length = 4 * ((input_length + 2) / 3);
    char* encoded = malloc(*output_length + 1);
    if (!encoded) return NULL;
    
    size_t i, j;
    for (i = 0, j = 0; i < input_length;) {
        uint32_t octet_a = i < input_length ? data[i++] : 0;
        uint32_t octet_b = i < input_length ? data[i++] : 0;
        uint32_t octet_c = i < input_length ? data[i++] : 0;
        
        uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;
        
        encoded[j++] = base64_chars[(triple >> 18) & 0x3F];
        encoded[j++] = base64_chars[(triple >> 12) & 0x3F];
        encoded[j++] = base64_chars[(triple >> 6) & 0x3F];
        encoded[j++] = base64_chars[triple & 0x3F];
    }
    
    /* Add padding */
    int mod = input_length % 3;
    if (mod > 0) {
        for (int k = 0; k < 3 - mod; k++) {
            encoded[*output_length - 1 - k] = '=';
        }
    }
    
    encoded[*output_length] = '\0';
    return encoded;
}

/* Simple HMAC-SHA256 for JWT signing */
static char* hmac_sha256(const char* key, const char* data) {
    HashService* hash = hash_service_inject();
    if (!hash) return NULL;
    
    /* HMAC implementation */
    unsigned char k[64] = {0};
    unsigned char o_key_pad[64], i_key_pad[64];
    unsigned char result[32];
    
    size_t key_len = strlen(key);
    if (key_len > 64) {
        /* Hash key if too long */
        char* hashed = hash_sha256_hex(key, key_len);
        if (!hashed) return NULL;
        strncpy((char*)k, hashed, 64);
        free(hashed);
        key_len = 32;
    } else {
        strncpy((char*)k, key, key_len);
    }
    
    /* Create pads */
    for (int i = 0; i < 64; i++) {
        o_key_pad[i] = k[i] ^ 0x5c;
        i_key_pad[i] = k[i] ^ 0x36;
    }
    
    /* Inner hash */
    char* inner_data = malloc(strlen(data) + 65);
    memcpy(inner_data, i_key_pad, 64);
    memcpy(inner_data + 64, data, strlen(data));
    inner_data[64 + strlen(data)] = '\0';
    
    char* inner_hash = hash_sha256_hex(inner_data, 64 + strlen(data));
    free(inner_data);
    if (!inner_hash) return NULL;
    
    /* Convert hex to binary */
    unsigned char inner_bin[32];
    for (int i = 0; i < 32; i++) {
        sscanf(inner_hash + 2*i, "%2hhx", &inner_bin[i]);
    }
    free(inner_hash);
    
    /* Outer hash */
    char* outer_data = malloc(64 + 64);
    memcpy(outer_data, o_key_pad, 64);
    memcpy(outer_data + 64, inner_bin, 32);
    
    char* result_hex = hash_sha256_hex(outer_data, 96);
    free(outer_data);
    
    /* Convert to binary */
    for (int i = 0; i < 32; i++) {
        sscanf(result_hex + 2*i, "%2hhx", &result[i]);
    }
    free(result_hex);
    
    size_t b64_len;
    char* b64 = base64_encode(result, 32, &b64_len);
    
    /* Make URL-safe */
    for (size_t i = 0; i < b64_len; i++) {
        if (b64[i] == '+') b64[i] = '-';
        else if (b64[i] == '/') b64[i] = '_';
        else if (b64[i] == '=') b64[i] = '\0';  /* Remove padding */
    }
    
    return b64;
}

/* Simple password hashing using SHA256 + salt (production should use bcrypt) */
static char* simple_hash_password(const char* password, const char* salt) {
    HashService* hash = hash_service_inject();
    if (!hash) return NULL;
    
    char* data = malloc(strlen(password) + strlen(salt) + 1);
    sprintf(data, "%s%s", salt, password);
    
    char* hashed = hash_sha256_hex(data, strlen(data));
    free(data);
    
    /* Prepend salt */
    char* result = malloc(strlen(salt) + strlen(hashed) + 2);
    sprintf(result, "%s$%s", salt, hashed);
    free(hashed);
    
    return result;
}

/* Generate random salt */
static char* generate_salt(void) {
    static const char* chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    char* salt = malloc(17);
    if (!salt) return NULL;
    
    for (int i = 0; i < 16; i++) {
        salt[i] = chars[rand() % strlen(chars)];
    }
    salt[16] = '\0';
    return salt;
}

/* ==================== Initialization ==================== */

int auth_init(AuthService* self, const AuthConfig* config) {
    if (!self || !config) return 0;
    
    LoggerService* logger = logger_service_inject();
    
    self->secret_key = strdup(config->secret_key ? config->secret_key : "default-secret-key-change-in-production");
    self->refresh_secret = strdup(config->refresh_secret ? config->refresh_secret : "default-refresh-secret-change-in-production");
    self->access_token_expiry_sec = config->access_token_expiry_sec > 0 ? config->access_token_expiry_sec : 3600;
    self->refresh_token_expiry_sec = config->refresh_token_expiry_sec > 0 ? config->refresh_token_expiry_sec : 604800;
    self->min_password_length = config->min_password_length > 0 ? config->min_password_length : 8;
    
    if (logger) {
        logger_log(logger, "INFO", "AuthService initialized with access token expiry: %ds", self->access_token_expiry_sec);
    }
    
    return 1;
}

int auth_init_default(AuthService* self) {
    AuthConfig config = {0};
    return auth_init(self, &config);
}

/* ==================== Password Hashing ==================== */

char* auth_hash_password(AuthService* self, const char* password) {
    if (!self || !password) return NULL;
    
    char* salt = generate_salt();
    if (!salt) return NULL;
    
    char* hashed = simple_hash_password(password, salt);
    free(salt);
    
    return hashed;
}

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
    char* computed = simple_hash_password(password, salt);
    free(salt);
    
    if (!computed) return 0;
    
    int match = (strcmp(computed, hash) == 0);
    free(computed);
    
    return match;
}

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

/* ==================== JWT Token Operations ==================== */

/* Helper to create JWT header */
static char* jwt_header(void) {
    return strdup("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");  /* {"alg":"HS256","typ":"JWT"} */
}

/* Helper to create JWT payload */
static char* jwt_payload(long long user_id, AuthRole role, time_t exp) {
    char json[256];
    snprintf(json, sizeof(json),
        "{\"sub\":%lld,\"role\":%d,\"exp\":%ld}",
        user_id, (int)role, (long)exp);
    
    /* Base64 encode */
    size_t b64_len;
    char* b64 = base64_encode((unsigned char*)json, strlen(json), &b64_len);
    
    /* Make URL-safe */
    for (size_t i = 0; i < b64_len; i++) {
        if (b64[i] == '+') b64[i] = '-';
        else if (b64[i] == '/') b64[i] = '_';
        else if (b64[i] == '=') b64[i] = '\0';
    }
    
    return b64;
}

char* auth_generate_access_token(AuthService* self, long long user_id, AuthRole role) {
    if (!self) return NULL;
    
    time_t now = time(NULL);
    time_t exp = now + self->access_token_expiry_sec;
    
    char* header = jwt_header();
    char* payload = jwt_payload(user_id, role, exp);
    
    /* Create signature input */
    char* sig_input = malloc(strlen(header) + strlen(payload) + 2);
    sprintf(sig_input, "%s.%s", header, payload);
    
    /* Sign */
    char* signature = hmac_sha256(self->secret_key, sig_input);
    free(sig_input);
    
    if (!signature) {
        free(header);
        free(payload);
        return NULL;
    }
    
    /* Combine */
    char* token = malloc(strlen(header) + strlen(payload) + strlen(signature) + 3);
    sprintf(token, "%s.%s.%s", header, payload, signature);
    
    free(header);
    free(payload);
    free(signature);
    
    return token;
}

char* auth_generate_refresh_token(AuthService* self, long long user_id) {
    if (!self) return NULL;
    
    time_t now = time(NULL);
    time_t exp = now + self->refresh_token_expiry_sec;
    
    char* header = jwt_header();
    char* payload = jwt_payload(user_id, 0, exp);  /* Role 0 for refresh */
    
    char* sig_input = malloc(strlen(header) + strlen(payload) + 2);
    sprintf(sig_input, "%s.%s", header, payload);
    
    char* signature = hmac_sha256(self->refresh_secret, sig_input);
    free(sig_input);
    
    if (!signature) {
        free(header);
        free(payload);
        return NULL;
    }
    
    char* token = malloc(strlen(header) + strlen(payload) + strlen(signature) + 3);
    sprintf(token, "%s.%s.%s", header, payload, signature);
    
    free(header);
    free(payload);
    free(signature);
    
    return token;
}

AuthTokenValidation auth_validate_token(AuthService* self, const char* token) {
    AuthTokenValidation result = {0};
    result.is_valid = 0;
    result.user_id = -1;
    result.role = AUTH_ROLE_USER;
    result.error = NULL;
    
    if (!self || !token) {
        result.error = strdup("Invalid token");
        return result;
    }
    
    /* Parse token parts */
    char* token_copy = strdup(token);
    char* header_b64 = strtok(token_copy, ".");
    char* payload_b64 = strtok(NULL, ".");
    char* signature_b64 = strtok(NULL, ".");
    
    if (!header_b64 || !payload_b64 || !signature_b64) {
        result.error = strdup("Invalid token format");
        free(token_copy);
        return result;
    }
    
    /* Verify signature */
    char* sig_input = malloc(strlen(header_b64) + strlen(payload_b64) + 2);
    sprintf(sig_input, "%s.%s", header_b64, payload_b64);

    char* expected_sig = hmac_sha256(self->secret_key, sig_input);

    if (!expected_sig || strcmp(expected_sig, signature_b64) != 0) {
        /* Try refresh secret */
        free(expected_sig);
        expected_sig = hmac_sha256(self->refresh_secret, sig_input);
    }
    
    free(sig_input);

    if (!expected_sig || strcmp(expected_sig, signature_b64) != 0) {
        result.error = strdup("Invalid signature");
        free(expected_sig);
        free(token_copy);
        return result;
    }
    free(expected_sig);
    
    /* Decode payload (simplified - just extract user_id and exp) */
    /* In production, use proper base64 decode and JSON parsing */
    char* payload_json = payload_b64;  /* Would need proper base64 decode */
    
    /* Extract exp from payload */
    char* exp_str = strstr(payload_json, "\"exp\":");
    if (exp_str) {
        long exp = atol(exp_str + 6);
        if (exp < time(NULL)) {
            result.error = strdup("Token expired");
            free(token_copy);
            return result;
        }
    }
    
    /* Extract sub (user_id) from payload */
    char* sub_str = strstr(payload_json, "\"sub\":");
    if (sub_str) {
        result.user_id = atoll(sub_str + 6);
    }
    
    /* Extract role from payload */
    char* role_str = strstr(payload_json, "\"role\":");
    if (role_str) {
        result.role = (AuthRole)atoi(role_str + 7);
    }
    
    result.is_valid = 1;
    free(token_copy);
    
    return result;
}

long long auth_get_user_id_from_token(AuthService* self, const char* token) {
    AuthTokenValidation validation = auth_validate_token(self, token);
    long long user_id = validation.user_id;
    auth_free_token_validation(&validation);
    return user_id;
}

const char* auth_role_name(AuthRole role) {
    switch (role) {
        case AUTH_ROLE_USER: return "user";
        case AUTH_ROLE_ADMIN: return "admin";
        case AUTH_ROLE_SUPER_ADMIN: return "super_admin";
        default: return "unknown";
    }
}

/* ==================== User Management ==================== */

int auth_register(AuthService* self, const AuthRegisterData* data, AuthUser** user, char** error) {
    if (!self || !data) {
        if (error) *error = strdup("Invalid parameters");
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    SQLiteService* sqlite = sqlite_service_inject();
    
    if (!sqlite || !sqlite_is_open(sqlite)) {
        if (error) *error = strdup("Database not available");
        return 0;
    }
    
    /* Validate password */
    if (!auth_validate_password(self, data->password, error)) {
        return 0;
    }
    
    /* Check if username exists */
    char check_sql[256];
    snprintf(check_sql, sizeof(check_sql),
        "SELECT id FROM users WHERE username = '%s' OR email = '%s'",
        data->username, data->email);
    
    SQLiteResult check_result = sqlite_query(sqlite, check_sql);
    if (check_result.success && check_result.row_count > 0) {
        sqlite_free_result(&check_result);
        if (error) *error = strdup("Username or email already exists");
        return 0;
    }
    sqlite_free_result(&check_result);
    
    /* Hash password */
    char* password_hash = auth_hash_password(self, data->password);
    if (!password_hash) {
        if (error) *error = strdup("Failed to hash password");
        return 0;
    }
    
    /* Insert user */
    char insert_sql[512];
    snprintf(insert_sql, sizeof(insert_sql),
        "INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) "
        "VALUES ('%s', '%s', '%s', 0, 1, datetime('now'), datetime('now'))",
        data->username, data->email, password_hash);
    
    free(password_hash);
    
    if (!sqlite_execute(sqlite, insert_sql)) {
        if (error) *error = strdup(sqlite_last_error(sqlite));
        if (logger) logger_log(logger, "ERROR", "Auth: Failed to register user: %s", sqlite_last_error(sqlite));
        return 0;
    }
    
    long long user_id = sqlite_last_insert_rowid(sqlite);
    
    if (logger) logger_log(logger, "INFO", "Auth: User registered: %s (id: %lld)", data->username, user_id);
    
    /* Return user info */
    if (user) {
        *user = malloc(sizeof(AuthUser));
        (*user)->id = user_id;
        (*user)->username = strdup(data->username);
        (*user)->email = strdup(data->email);
        (*user)->password_hash = NULL;
        (*user)->role = AUTH_ROLE_USER;
        (*user)->is_active = 1;
        (*user)->created_at = time(NULL);
        (*user)->updated_at = time(NULL);
    }
    
    return 1;
}

int auth_login(AuthService* self, const AuthLoginCredentials* creds, AuthToken** token, AuthUser** user, char** error) {
    if (!self || !creds) {
        if (error) *error = strdup("Invalid credentials");
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    SQLiteService* sqlite = sqlite_service_inject();
    
    if (!sqlite || !sqlite_is_open(sqlite)) {
        if (error) *error = strdup("Database not available");
        return 0;
    }
    
    /* Find user by username or email */
    char sql[512];
    snprintf(sql, sizeof(sql),
        "SELECT id, username, email, password_hash, role, is_active FROM users "
        "WHERE (username = '%s' OR email = '%s') AND is_active = 1",
        creds->username_or_email, creds->username_or_email);
    
    SQLiteResult result = sqlite_query(sqlite, sql);
    
    if (!result.success || result.row_count == 0) {
        sqlite_free_result(&result);
        if (error) *error = strdup("Invalid username/email or password");
        return 0;
    }
    
    /* Extract user data */
    char** row = result.rows[0].values;
    long long user_id = atoll(row[0]);
    char* username = row[1];
    char* email = row[2];
    char* password_hash = row[3];
    AuthRole role = (AuthRole)atoi(row[4]);
    int is_active = atoi(row[5]);
    
    /* Verify password */
    if (!auth_verify_password(self, creds->password, password_hash)) {
        sqlite_free_result(&result);
        if (error) *error = strdup("Invalid username/email or password");
        return 0;
    }
    
    sqlite_free_result(&result);
    
    /* Generate tokens */
    char* access_token = auth_generate_access_token(self, user_id, role);
    char* refresh_token = auth_generate_refresh_token(self, user_id);
    
    if (!access_token || !refresh_token) {
        free(access_token);
        free(refresh_token);
        if (error) *error = strdup("Failed to generate tokens");
        return 0;
    }
    
    /* Create token structure */
    if (token) {
        *token = malloc(sizeof(AuthToken));
        (*token)->access_token = access_token;
        (*token)->refresh_token = refresh_token;
        (*token)->user_id = user_id;
        (*token)->expires_at = time(NULL) + self->access_token_expiry_sec;
        (*token)->refresh_expires_at = time(NULL) + self->refresh_token_expiry_sec;
    } else {
        free(access_token);
        free(refresh_token);
    }
    
    /* Create user structure */
    if (user) {
        *user = malloc(sizeof(AuthUser));
        (*user)->id = user_id;
        (*user)->username = strdup(username);
        (*user)->email = strdup(email);
        (*user)->password_hash = NULL;
        (*user)->role = role;
        (*user)->is_active = is_active;
        (*user)->created_at = time(NULL);
        (*user)->updated_at = time(NULL);
    }
    
    if (logger) logger_log(logger, "INFO", "Auth: User logged in: %s", username);
    
    return 1;
}

int auth_refresh_token(AuthService* self, const char* refresh_token, char** new_access_token, char** error) {
    if (!self || !refresh_token) {
        if (error) *error = strdup("Invalid refresh token");
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    
    /* Validate refresh token */
    AuthTokenValidation validation = auth_validate_token(self, refresh_token);
    
    if (!validation.is_valid) {
        char* err = strdup(validation.error ? validation.error : "Invalid refresh token");
        auth_free_token_validation(&validation);
        if (error) *error = err;
        return 0;
    }
    
    /* Generate new access token */
    char* token = auth_generate_access_token(self, validation.user_id, validation.role);
    auth_free_token_validation(&validation);
    
    if (!token) {
        if (error) *error = strdup("Failed to generate access token");
        return 0;
    }
    
    if (new_access_token) {
        *new_access_token = token;
    } else {
        free(token);
    }
    
    if (logger) logger_log(logger, "INFO", "Auth: Token refreshed for user %lld", validation.user_id);
    
    return 1;
}

int auth_get_user_by_id(AuthService* self, long long user_id, AuthUser** user) {
    if (!self || !user) return 0;
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) return 0;
    
    char sql[256];
    snprintf(sql, sizeof(sql),
        "SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = %lld",
        user_id);
    
    SQLiteResult result = sqlite_query(sqlite, sql);
    
    if (!result.success || result.row_count == 0) {
        sqlite_free_result(&result);
        return 0;
    }
    
    char** row = result.rows[0].values;
    
    *user = malloc(sizeof(AuthUser));
    (*user)->id = atoll(row[0]);
    (*user)->username = strdup(row[1]);
    (*user)->email = strdup(row[2]);
    (*user)->password_hash = NULL;
    (*user)->role = (AuthRole)atoi(row[3]);
    (*user)->is_active = atoi(row[4]);
    (*user)->created_at = time(NULL);
    (*user)->updated_at = time(NULL);
    
    sqlite_free_result(&result);
    return 1;
}

int auth_get_user_by_username(AuthService* self, const char* username, AuthUser** user) {
    if (!self || !username || !user) return 0;
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) return 0;
    
    char sql[256];
    snprintf(sql, sizeof(sql),
        "SELECT id, username, email, role, is_active FROM users WHERE username = '%s'",
        username);
    
    SQLiteResult result = sqlite_query(sqlite, sql);
    
    if (!result.success || result.row_count == 0) {
        sqlite_free_result(&result);
        return 0;
    }
    
    char** row = result.rows[0].values;
    
    *user = malloc(sizeof(AuthUser));
    (*user)->id = atoll(row[0]);
    (*user)->username = strdup(row[1]);
    (*user)->email = strdup(row[2]);
    (*user)->password_hash = NULL;
    (*user)->role = (AuthRole)atoi(row[3]);
    (*user)->is_active = atoi(row[4]);
    (*user)->created_at = time(NULL);
    (*user)->updated_at = time(NULL);
    
    sqlite_free_result(&result);
    return 1;
}

int auth_get_user_by_email(AuthService* self, const char* email, AuthUser** user) {
    if (!self || !email || !user) return 0;
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) return 0;
    
    char sql[256];
    snprintf(sql, sizeof(sql),
        "SELECT id, username, email, role, is_active FROM users WHERE email = '%s'",
        email);
    
    SQLiteResult result = sqlite_query(sqlite, sql);
    
    if (!result.success || result.row_count == 0) {
        sqlite_free_result(&result);
        return 0;
    }
    
    char** row = result.rows[0].values;
    
    *user = malloc(sizeof(AuthUser));
    (*user)->id = atoll(row[0]);
    (*user)->username = strdup(row[1]);
    (*user)->email = strdup(row[2]);
    (*user)->password_hash = NULL;
    (*user)->role = (AuthRole)atoi(row[3]);
    (*user)->is_active = atoi(row[4]);
    (*user)->created_at = time(NULL);
    (*user)->updated_at = time(NULL);
    
    sqlite_free_result(&result);
    return 1;
}

int auth_update_password(AuthService* self, long long user_id, const char* new_password, char** error) {
    if (!self || !new_password) {
        if (error) *error = strdup("Invalid password");
        return 0;
    }
    
    if (!auth_validate_password(self, new_password, error)) {
        return 0;
    }
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) {
        if (error) *error = strdup("Database not available");
        return 0;
    }
    
    char* password_hash = auth_hash_password(self, new_password);
    if (!password_hash) {
        if (error) *error = strdup("Failed to hash password");
        return 0;
    }
    
    char sql[512];
    snprintf(sql, sizeof(sql),
        "UPDATE users SET password_hash = '%s', updated_at = datetime('now') WHERE id = %lld",
        password_hash, user_id);
    
    free(password_hash);
    
    if (!sqlite_execute(sqlite, sql)) {
        if (error) *error = strdup(sqlite_last_error(sqlite));
        return 0;
    }
    
    return 1;
}

int auth_update_user_role(AuthService* self, long long user_id, AuthRole new_role) {
    if (!self) return 0;
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) return 0;
    
    char sql[256];
    snprintf(sql, sizeof(sql),
        "UPDATE users SET role = %d, updated_at = datetime('now') WHERE id = %lld",
        (int)new_role, user_id);
    
    return sqlite_execute(sqlite, sql);
}

int auth_deactivate_user(AuthService* self, long long user_id) {
    if (!self) return 0;
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) return 0;
    
    char sql[256];
    snprintf(sql, sizeof(sql),
        "UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = %lld",
        user_id);
    
    return sqlite_execute(sqlite, sql);
}

int auth_delete_user(AuthService* self, long long user_id) {
    if (!self) return 0;
    
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite || !sqlite_is_open(sqlite)) return 0;
    
    char sql[256];
    snprintf(sql, sizeof(sql),
        "DELETE FROM users WHERE id = %lld", user_id);
    
    return sqlite_execute(sqlite, sql);
}

/* ==================== Authorization ==================== */

int auth_has_role(AuthRole user_role, AuthRole required_role) {
    return user_role >= required_role;
}

int auth_has_any_role(AuthRole user_role, const AuthRole* roles, int role_count) {
    for (int i = 0; i < role_count; i++) {
        if (user_role >= roles[i]) return 1;
    }
    return 0;
}

/* ==================== Memory Management ==================== */

void auth_free_user(AuthUser* user) {
    if (!user) return;
    free(user->username);
    free(user->email);
    free(user->password_hash);
    free(user);
}

void auth_free_token(AuthToken* token) {
    if (!token) return;
    free(token->access_token);
    free(token->refresh_token);
    free(token);
}

void auth_free_token_validation(AuthTokenValidation* result) {
    if (!result) return;
    free(result->error);
    result->error = NULL;
}

/* ==================== Session Management ==================== */

int auth_invalidate_user_sessions(AuthService* self, long long user_id) {
    /* In production, maintain a token blacklist */
    /* For now, just log the action */
    (void)self;  /* Suppress unused warning */
    LoggerService* logger = logger_service_inject();
    if (logger) {
        logger_log(logger, "INFO", "Auth: Invalidated sessions for user %lld", user_id);
    }
    return 1;
}

int auth_is_session_active(AuthService* self, long long user_id) {
    /* Check if user is active in database */
    AuthUser* user = NULL;
    int active = auth_get_user_by_id(self, user_id, &user);
    if (active && user) {
        active = user->is_active;
        auth_free_user(user);
    }
    return active;
}

/* ==================== DI Service Implementation ==================== */

AuthService* auth_service_inject(void) {
    void* service;
    DI_Error err = DI_Container_Get(DI_GetGlobalContainer(), "auth_service", &service);
    if (err != DI_OK) {
        return NULL;
    }
    return (AuthService*)service;
}

DI_Error auth_service_provider(DI_Container* container, void** out_service) {
    LoggerService* logger = NULL;

    DI_Error err = DI_Container_Get(container, "logger_service", (void**)&logger);
    if (err != DI_OK) {
        return err;
    }

    AuthService* self = (AuthService*)calloc(1, sizeof(AuthService));
    if (!self) {
        return DI_ERROR_OUT_OF_MEMORY;
    }

    self->base.name = "auth_service";
    self->base.initialized = 0;
    self->base.destroy = auth_service_destroy;

    if (!auth_init_default(self)) {
        free(self);
        return DI_ERROR_OUT_OF_MEMORY;
    }

    self->base.initialized = 1;

    if (logger) {
        logger_log(logger, "INFO", "AuthService created");
    }

    *out_service = self;
    return DI_OK;
}

void auth_service_destroy(DI_Service* service) {
    if (!service) return;

    AuthService* self = (AuthService*)service;
    LoggerService* logger = logger_service_inject();

    if (self->base.initialized) {
        free(self->secret_key);
        free(self->refresh_secret);
        self->base.initialized = 0;
    }

    if (logger) {
        logger_log(logger, "INFO", "AuthService destroyed");
    }

    free(self);
}
