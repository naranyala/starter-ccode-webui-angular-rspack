/* Auth Service - JWT Token Operations */

#include "services/auth/auth_service.h"
#include "services/auth/auth_internal.h"
#include "services/hash_service.h"

/* Base64 encode */
char* auth_base64_encode(const unsigned char* data, size_t input_length, size_t* output_length) {
    *output_length = 4 * ((input_length + 2) / 3);
    char* encoded = malloc(*output_length + 1);
    if (!encoded) return NULL;
    
    size_t i, j;
    for (i = 0, j = 0; i < input_length;) {
        uint32_t octet_a = i < input_length ? data[i++] : 0;
        uint32_t octet_b = i < input_length ? data[i++] : 0;
        uint32_t octet_c = i < input_length ? data[i++] : 0;
        
        uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;
        
        encoded[j++] = BASE64_CHARS[(triple >> 18) & 0x3F];
        encoded[j++] = BASE64_CHARS[(triple >> 12) & 0x3F];
        encoded[j++] = BASE64_CHARS[(triple >> 6) & 0x3F];
        encoded[j++] = BASE64_CHARS[triple & 0x3F];
    }
    
    int mod = input_length % 3;
    if (mod > 0) {
        for (int k = 0; k < 3 - mod; k++) {
            encoded[*output_length - 1 - k] = '=';
        }
    }
    
    encoded[*output_length] = '\0';
    return encoded;
}

/* HMAC-SHA256 for JWT signing */
char* auth_hmac_sha256(const char* key, const char* data) {
    HashService* hash = hash_service_inject();
    if (!hash) return NULL;
    
    unsigned char k[64] = {0};
    unsigned char o_key_pad[64], i_key_pad[64];
    unsigned char result[32];
    
    size_t key_len = strlen(key);
    if (key_len > 64) {
        char* hashed = hash_sha256_hex(key, key_len);
        if (!hashed) return NULL;
        strncpy((char*)k, hashed, 64);
        free(hashed);
        key_len = 32;
    } else {
        strncpy((char*)k, key, key_len);
    }
    
    for (int i = 0; i < 64; i++) {
        o_key_pad[i] = k[i] ^ 0x5c;
        i_key_pad[i] = k[i] ^ 0x36;
    }
    
    char* inner_data = malloc(strlen(data) + 65);
    memcpy(inner_data, i_key_pad, 64);
    memcpy(inner_data + 64, data, strlen(data));
    inner_data[64 + strlen(data)] = '\0';
    
    char* inner_hash = hash_sha256_hex(inner_data, 64 + strlen(data));
    free(inner_data);
    if (!inner_hash) return NULL;
    
    unsigned char inner_bin[32];
    for (int i = 0; i < 32; i++) {
        sscanf(inner_hash + 2*i, "%2hhx", &inner_bin[i]);
    }
    free(inner_hash);
    
    char* outer_data = malloc(64 + 64);
    memcpy(outer_data, o_key_pad, 64);
    memcpy(outer_data + 64, inner_bin, 32);
    
    char* result_hex = hash_sha256_hex(outer_data, 96);
    free(outer_data);
    
    for (int i = 0; i < 32; i++) {
        sscanf(result_hex + 2*i, "%2hhx", &result[i]);
    }
    free(result_hex);
    
    size_t b64_len;
    char* b64 = auth_base64_encode(result, 32, &b64_len);
    
    for (size_t i = 0; i < b64_len; i++) {
        if (b64[i] == '+') b64[i] = '-';
        else if (b64[i] == '/') b64[i] = '_';
        else if (b64[i] == '=') b64[i] = '\0';
    }
    
    return b64;
}

/* JWT header */
char* auth_jwt_header(void) {
    return strdup("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
}

/* JWT payload */
char* auth_jwt_payload(long long user_id, AuthRole role, time_t exp) {
    char json[256];
    snprintf(json, sizeof(json),
        "{\"sub\":%lld,\"role\":%d,\"exp\":%ld}",
        user_id, (int)role, (long)exp);
    
    size_t b64_len;
    char* b64 = auth_base64_encode((unsigned char*)json, strlen(json), &b64_len);
    
    for (size_t i = 0; i < b64_len; i++) {
        if (b64[i] == '+') b64[i] = '-';
        else if (b64[i] == '/') b64[i] = '_';
        else if (b64[i] == '=') b64[i] = '\0';
    }
    
    return b64;
}

/* Generate JWT access token */
char* auth_generate_access_token(AuthService* self, long long user_id, AuthRole role) {
    if (!self) return NULL;
    
    time_t now = time(NULL);
    time_t exp = now + self->access_token_expiry_sec;
    
    char* header = auth_jwt_header();
    char* payload = auth_jwt_payload(user_id, role, exp);
    
    char* sig_input = malloc(strlen(header) + strlen(payload) + 2);
    sprintf(sig_input, "%s.%s", header, payload);
    
    char* signature = auth_hmac_sha256(self->secret_key, sig_input);
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

/* Generate JWT refresh token */
char* auth_generate_refresh_token(AuthService* self, long long user_id) {
    if (!self) return NULL;
    
    time_t now = time(NULL);
    time_t exp = now + self->refresh_token_expiry_sec;
    
    char* header = auth_jwt_header();
    char* payload = auth_jwt_payload(user_id, 0, exp);
    
    char* sig_input = malloc(strlen(header) + strlen(payload) + 2);
    sprintf(sig_input, "%s.%s", header, payload);
    
    char* signature = auth_hmac_sha256(self->refresh_secret, sig_input);
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
