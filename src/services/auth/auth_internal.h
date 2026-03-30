/* Auth Service Internal Header */

#ifndef AUTH_SERVICE_INTERNAL_H
#define AUTH_SERVICE_INTERNAL_H

#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>
#include <ctype.h>

/* Internal base64 encoding */
static const char BASE64_CHARS[] = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

char* auth_base64_encode(const unsigned char* data, size_t input_length, size_t* output_length);

/* Internal HMAC-SHA256 for JWT */
char* auth_hmac_sha256(const char* key, const char* data);

/* Internal password hashing */
char* auth_simple_hash_password(const char* password, const char* salt);
char* auth_generate_salt(void);

/* JWT helpers */
char* auth_jwt_header(void);
char* auth_jwt_payload(long long user_id, AuthRole role, time_t exp);

#endif /* AUTH_INTERNAL_H */
