/* Hash Service Implementation */

#include "hash_service.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============ CRC32 ============ */

static uint32_t crc32_table[256];
static int crc32_table_init = 0;

static void init_crc32_table(void) {
    if (crc32_table_init) return;
    
    for (uint32_t i = 0; i < 256; i++) {
        uint32_t crc = i;
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
        }
        crc32_table[i] = crc;
    }
    crc32_table_init = 1;
}

uint32_t hash_crc32(const void* data, size_t len) {
    init_crc32_table();
    
    const uint8_t* buf = (const uint8_t*)data;
    uint32_t crc = 0xFFFFFFFF;
    
    for (size_t i = 0; i < len; i++) {
        crc = (crc >> 8) ^ crc32_table[(crc ^ buf[i]) & 0xFF];
    }
    
    return crc ^ 0xFFFFFFFF;
}

/* ============ MD5 ============ */

#define MD5_ROTATE_LEFT(x, n) (((x) << (n)) | ((x) >> (32 - (n))))

#define MD5_F(x, y, z) (((x) & (y)) | ((~x) & (z)))
#define MD5_G(x, y, z) (((x) & (z)) | ((y) & (~z)))
#define MD5_H(x, y, z) ((x) ^ (y) ^ (z))
#define MD5_I(x, y, z) ((y) ^ ((x) | (~z)))

#define MD5_ROUND(a, b, c, d, x, s, ac, func) do { \
    (a) += func((b), (c), (d)) + (x) + (uint32_t)(ac); \
    (a) = MD5_ROTATE_LEFT((a), (s)); \
    (a) += (b); \
} while (0)

static void md5_transform(uint32_t state[4], const uint8_t block[64]) {
    uint32_t a = state[0], b = state[1], c = state[2], d = state[3];
    uint32_t x[16];
    
    /* Convert block to little-endian */
    for (int i = 0; i < 16; i++) {
        x[i] = (uint32_t)block[i*4] | ((uint32_t)block[i*4+1] << 8) |
               ((uint32_t)block[i*4+2] << 16) | ((uint32_t)block[i*4+3] << 24);
    }
    
    /* Round 1 */
    MD5_ROUND(a, b, c, d, x[ 0],  7, 0xd76aa478, MD5_F);
    MD5_ROUND(d, a, b, c, x[ 1], 12, 0xe8c7b756, MD5_F);
    MD5_ROUND(c, d, a, b, x[ 2], 17, 0x242070db, MD5_F);
    MD5_ROUND(b, c, d, a, x[ 3], 22, 0xc1bdceee, MD5_F);
    MD5_ROUND(a, b, c, d, x[ 4],  7, 0xf57c0faf, MD5_F);
    MD5_ROUND(d, a, b, c, x[ 5], 12, 0x4787c62a, MD5_F);
    MD5_ROUND(c, d, a, b, x[ 6], 17, 0xa8304613, MD5_F);
    MD5_ROUND(b, c, d, a, x[ 7], 22, 0xfd469501, MD5_F);
    MD5_ROUND(a, b, c, d, x[ 8],  7, 0x698098d8, MD5_F);
    MD5_ROUND(d, a, b, c, x[ 9], 12, 0x8b44f7af, MD5_F);
    MD5_ROUND(c, d, a, b, x[10], 17, 0xffff5bb1, MD5_F);
    MD5_ROUND(b, c, d, a, x[11], 22, 0x895cd7be, MD5_F);
    MD5_ROUND(a, b, c, d, x[12],  7, 0x6b901122, MD5_F);
    MD5_ROUND(d, a, b, c, x[13], 12, 0xfd987193, MD5_F);
    MD5_ROUND(c, d, a, b, x[14], 17, 0xa679438e, MD5_F);
    MD5_ROUND(b, c, d, a, x[15], 22, 0x49b40821, MD5_F);
    
    /* Round 2 */
    MD5_ROUND(a, b, c, d, x[ 1],  5, 0xf61e2562, MD5_G);
    MD5_ROUND(d, a, b, c, x[ 6],  9, 0xc040b340, MD5_G);
    MD5_ROUND(c, d, a, b, x[11], 14, 0x265e5a51, MD5_G);
    MD5_ROUND(b, c, d, a, x[ 0], 20, 0xe9b6c7aa, MD5_G);
    MD5_ROUND(a, b, c, d, x[ 5],  5, 0xd62f105d, MD5_G);
    MD5_ROUND(d, a, b, c, x[10],  9, 0x02441453, MD5_G);
    MD5_ROUND(c, d, a, b, x[15], 14, 0xd8a1e681, MD5_G);
    MD5_ROUND(b, c, d, a, x[ 4], 20, 0xe7d3fbc8, MD5_G);
    MD5_ROUND(a, b, c, d, x[ 9],  5, 0x21e1cde6, MD5_G);
    MD5_ROUND(d, a, b, c, x[14],  9, 0xc33707d6, MD5_G);
    MD5_ROUND(c, d, a, b, x[ 3], 14, 0xf4d50d87, MD5_G);
    MD5_ROUND(b, c, d, a, x[ 8], 20, 0x455a14ed, MD5_G);
    MD5_ROUND(a, b, c, d, x[13],  5, 0xa9e3e905, MD5_G);
    MD5_ROUND(d, a, b, c, x[ 2],  9, 0xfcefa3f8, MD5_G);
    MD5_ROUND(c, d, a, b, x[ 7], 14, 0x676f02d9, MD5_G);
    MD5_ROUND(b, c, d, a, x[12], 20, 0x8d2a4c8a, MD5_G);
    
    /* Round 3 */
    MD5_ROUND(a, b, c, d, x[ 5],  4, 0xfffa3942, MD5_H);
    MD5_ROUND(d, a, b, c, x[ 8], 11, 0x8771f681, MD5_H);
    MD5_ROUND(c, d, a, b, x[11], 16, 0x6d9d6122, MD5_H);
    MD5_ROUND(b, c, d, a, x[14], 23, 0xfde5380c, MD5_H);
    MD5_ROUND(a, b, c, d, x[ 1],  4, 0xa4beea44, MD5_H);
    MD5_ROUND(d, a, b, c, x[ 4], 11, 0x4bdecfa9, MD5_H);
    MD5_ROUND(c, d, a, b, x[ 7], 16, 0xf6bb4b60, MD5_H);
    MD5_ROUND(b, c, d, a, x[10], 23, 0xbebfbc70, MD5_H);
    MD5_ROUND(a, b, c, d, x[13],  4, 0x289b7ec6, MD5_H);
    MD5_ROUND(d, a, b, c, x[ 0], 11, 0xeaa127fa, MD5_H);
    MD5_ROUND(c, d, a, b, x[ 3], 16, 0xd4ef3085, MD5_H);
    MD5_ROUND(b, c, d, a, x[ 6], 23, 0x04881d05, MD5_H);
    MD5_ROUND(a, b, c, d, x[ 9],  4, 0xd9d4d039, MD5_H);
    MD5_ROUND(d, a, b, c, x[12], 11, 0xe6db99e5, MD5_H);
    MD5_ROUND(c, d, a, b, x[15], 16, 0x1fa27cf8, MD5_H);
    MD5_ROUND(b, c, d, a, x[ 2], 23, 0xc4ac5665, MD5_H);
    
    /* Round 4 */
    MD5_ROUND(a, b, c, d, x[ 0],  6, 0xf4292244, MD5_I);
    MD5_ROUND(d, a, b, c, x[ 7], 10, 0x432aff97, MD5_I);
    MD5_ROUND(c, d, a, b, x[14], 15, 0xab9423a7, MD5_I);
    MD5_ROUND(b, c, d, a, x[ 5], 21, 0xfc93a039, MD5_I);
    MD5_ROUND(a, b, c, d, x[12],  6, 0x655b59c3, MD5_I);
    MD5_ROUND(d, a, b, c, x[ 3], 10, 0x8f0ccc92, MD5_I);
    MD5_ROUND(c, d, a, b, x[10], 15, 0xffeff47d, MD5_I);
    MD5_ROUND(b, c, d, a, x[ 1], 21, 0x85845dd1, MD5_I);
    MD5_ROUND(a, b, c, d, x[ 8],  6, 0x6fa87e4f, MD5_I);
    MD5_ROUND(d, a, b, c, x[15], 10, 0xfe2ce6e0, MD5_I);
    MD5_ROUND(c, d, a, b, x[ 6], 15, 0xa3014314, MD5_I);
    MD5_ROUND(b, c, d, a, x[13], 21, 0x4e0811a1, MD5_I);
    MD5_ROUND(a, b, c, d, x[ 4],  6, 0xf7537e82, MD5_I);
    MD5_ROUND(d, a, b, c, x[11], 10, 0xbd3af235, MD5_I);
    MD5_ROUND(c, d, a, b, x[ 2], 15, 0x2ad7d2bb, MD5_I);
    MD5_ROUND(b, c, d, a, x[ 9], 21, 0xeb86d391, MD5_I);
    
    state[0] += a; state[1] += b; state[2] += c; state[3] += d;
}

int hash_md5(const void* data, size_t len, uint8_t out[HASH_MD5_SIZE]) {
    if (!data || !out) return -1;
    
    /* Initial state */
    uint32_t state[4] = { 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476 };
    
    const uint8_t* buf = (const uint8_t*)data;
    uint64_t total_len = (uint64_t)len * 8;
    
    /* Process full blocks */
    size_t i = 0;
    while (i + 64 <= len) {
        md5_transform(state, buf + i);
        i += 64;
    }
    
    /* Pad remaining */
    uint8_t block[64] = {0};
    size_t remaining = len - i;
    memcpy(block, buf + i, remaining);
    block[remaining] = 0x80;
    
    if (remaining >= 56) {
        md5_transform(state, block);
        memset(block, 0, 64);
    }
    
    /* Append length */
    for (int j = 0; j < 8; j++) {
        block[56 + j] = (uint8_t)(total_len >> (j * 8));
    }
    md5_transform(state, block);
    
    /* Output little-endian */
    for (int j = 0; j < 4; j++) {
        out[j*4 + 0] = (uint8_t)(state[j]);
        out[j*4 + 1] = (uint8_t)(state[j] >> 8);
        out[j*4 + 2] = (uint8_t)(state[j] >> 16);
        out[j*4 + 3] = (uint8_t)(state[j] >> 24);
    }
    
    return 0;
}

/* ============ SHA1 ============ */

#define SHA1_ROTATE_LEFT(x, n) (((x) << (n)) | ((x) >> (32 - (n))))

static void sha1_transform(uint32_t state[5], const uint8_t block[64]) {
    uint32_t w[80];
    uint32_t a = state[0], b = state[1], c = state[2], d = state[3], e = state[4];
    
    /* Prepare message schedule */
    for (int i = 0; i < 16; i++) {
        w[i] = ((uint32_t)block[i*4] << 24) | ((uint32_t)block[i*4+1] << 16) |
               ((uint32_t)block[i*4+2] << 8) | ((uint32_t)block[i*4+3]);
    }
    for (int i = 16; i < 80; i++) {
        w[i] = SHA1_ROTATE_LEFT(w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16], 1);
    }
    
    /* Main loop */
    for (int i = 0; i < 80; i++) {
        uint32_t f, k;
        
        if (i < 20) {
            f = (b & c) | ((~b) & d);
            k = 0x5a827999;
        } else if (i < 40) {
            f = b ^ c ^ d;
            k = 0x6ed9eba1;
        } else if (i < 60) {
            f = (b & c) | (b & d) | (c & d);
            k = 0x8f1bbcdc;
        } else {
            f = b ^ c ^ d;
            k = 0xca62c1d6;
        }
        
        uint32_t temp = SHA1_ROTATE_LEFT(a, 5) + f + e + k + w[i];
        e = d; d = c; c = SHA1_ROTATE_LEFT(b, 30); b = a; a = temp;
    }
    
    state[0] += a; state[1] += b; state[2] += c; state[3] += d; state[4] += e;
}

int hash_sha1(const void* data, size_t len, uint8_t out[HASH_SHA1_SIZE]) {
    if (!data || !out) return -1;
    
    uint32_t state[5] = { 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 };
    const uint8_t* buf = (const uint8_t*)data;
    uint64_t total_len = (uint64_t)len * 8;
    
    size_t i = 0;
    while (i + 64 <= len) {
        sha1_transform(state, buf + i);
        i += 64;
    }
    
    uint8_t block[64] = {0};
    size_t remaining = len - i;
    memcpy(block, buf + i, remaining);
    block[remaining] = 0x80;
    
    if (remaining >= 56) {
        sha1_transform(state, block);
        memset(block, 0, 64);
    }
    
    for (int j = 0; j < 8; j++) {
        block[55 - j] = (uint8_t)(total_len >> (j * 8));
    }
    sha1_transform(state, block);
    
    for (int j = 0; j < 5; j++) {
        out[j*4 + 0] = (uint8_t)(state[j] >> 24);
        out[j*4 + 1] = (uint8_t)(state[j] >> 16);
        out[j*4 + 2] = (uint8_t)(state[j] >> 8);
        out[j*4 + 3] = (uint8_t)(state[j]);
    }
    
    return 0;
}

/* ============ SHA256 ============ */

static const uint32_t sha256_k[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

#define SHA256_ROTR(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define SHA256_CH(x, y, z) (((x) & (y)) ^ ((~x) & (z)))
#define SHA256_MAJ(x, y, z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define SHA256_EP0(x) (SHA256_ROTR(x, 2) ^ SHA256_ROTR(x, 13) ^ SHA256_ROTR(x, 22))
#define SHA256_EP1(x) (SHA256_ROTR(x, 6) ^ SHA256_ROTR(x, 11) ^ SHA256_ROTR(x, 25))
#define SHA256_SIG0(x) (SHA256_ROTR(x, 7) ^ SHA256_ROTR(x, 18) ^ ((x) >> 3))
#define SHA256_SIG1(x) (SHA256_ROTR(x, 17) ^ SHA256_ROTR(x, 19) ^ ((x) >> 10))

static void sha256_transform(uint32_t state[8], const uint8_t block[64]) {
    uint32_t w[64];
    uint32_t a = state[0], b = state[1], c = state[2], d = state[3];
    uint32_t e = state[4], f = state[5], g = state[6], h = state[7];
    
    for (int i = 0; i < 16; i++) {
        w[i] = ((uint32_t)block[i*4] << 24) | ((uint32_t)block[i*4+1] << 16) |
               ((uint32_t)block[i*4+2] << 8) | ((uint32_t)block[i*4+3]);
    }
    for (int i = 16; i < 64; i++) {
        uint32_t s0 = SHA256_SIG0(w[i-15]);
        uint32_t s1 = SHA256_SIG1(w[i-2]);
        w[i] = w[i-16] + s0 + w[i-7] + s1;
    }
    
    for (int i = 0; i < 64; i++) {
        uint32_t S1 = SHA256_EP1(e);
        uint32_t ch = SHA256_CH(e, f, g);
        uint32_t temp1 = h + S1 + ch + sha256_k[i] + w[i];
        uint32_t S0 = SHA256_EP0(a);
        uint32_t maj = SHA256_MAJ(a, b, c);
        uint32_t temp2 = S0 + maj;
        
        h = g; g = f; f = e; e = d + temp1;
        d = c; c = b; b = a; a = temp1 + temp2;
    }
    
    state[0] += a; state[1] += b; state[2] += c; state[3] += d;
    state[4] += e; state[5] += f; state[6] += g; state[7] += h;
}

int hash_sha256(const void* data, size_t len, uint8_t out[HASH_SHA256_SIZE]) {
    if (!data || !out) return -1;
    
    uint32_t state[8] = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    };
    
    const uint8_t* buf = (const uint8_t*)data;
    uint64_t total_len = (uint64_t)len * 8;
    
    size_t i = 0;
    while (i + 64 <= len) {
        sha256_transform(state, buf + i);
        i += 64;
    }
    
    uint8_t block[64] = {0};
    size_t remaining = len - i;
    memcpy(block, buf + i, remaining);
    block[remaining] = 0x80;
    
    if (remaining >= 56) {
        sha256_transform(state, block);
        memset(block, 0, 64);
    }
    
    for (int j = 0; j < 8; j++) {
        block[63 - j] = (uint8_t)(total_len >> (j * 8));
    }
    sha256_transform(state, block);
    
    for (int j = 0; j < 8; j++) {
        out[j*4 + 0] = (uint8_t)(state[j] >> 24);
        out[j*4 + 1] = (uint8_t)(state[j] >> 16);
        out[j*4 + 2] = (uint8_t)(state[j] >> 8);
        out[j*4 + 3] = (uint8_t)(state[j]);
    }
    
    return 0;
}

/* ============ Utilities ============ */

char* hash_bytes_to_hex(const uint8_t* bytes, size_t len) {
    static const char hex[] = "0123456789abcdef";
    char* out = (char*)malloc(len * 2 + 1);
    if (!out) return NULL;
    
    for (size_t i = 0; i < len; i++) {
        out[i*2] = hex[(bytes[i] >> 4) & 0x0F];
        out[i*2 + 1] = hex[bytes[i] & 0x0F];
    }
    out[len * 2] = '\0';
    return out;
}

char* hash_md5_hex(const void* data, size_t len) {
    uint8_t hash[HASH_MD5_SIZE];
    if (hash_md5(data, len, hash) < 0) return NULL;
    return hash_bytes_to_hex(hash, HASH_MD5_SIZE);
}

char* hash_sha1_hex(const void* data, size_t len) {
    uint8_t hash[HASH_SHA1_SIZE];
    if (hash_sha1(data, len, hash) < 0) return NULL;
    return hash_bytes_to_hex(hash, HASH_SHA1_SIZE);
}

char* hash_sha256_hex(const void* data, size_t len) {
    uint8_t hash[HASH_SHA256_SIZE];
    if (hash_sha256(data, len, hash) < 0) return NULL;
    return hash_bytes_to_hex(hash, HASH_SHA256_SIZE);
}

int hash_file_md5(const char* path, uint8_t out[HASH_MD5_SIZE]) {
    FILE* f = fopen(path, "rb");
    if (!f) return -1;
    
    uint32_t state[4] = { 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476 };
    uint8_t block[64];
    size_t bytes_read;
    uint64_t total_len = 0;
    
    while ((bytes_read = fread(block, 1, 64, f)) == 64) {
        md5_transform(state, block);
        total_len += 64 * 8;
    }
    
    /* Pad */
    uint8_t pad[64] = {0};
    memcpy(pad, block, bytes_read);
    pad[bytes_read] = 0x80;
    total_len += bytes_read * 8;
    
    if (bytes_read >= 56) {
        md5_transform(state, pad);
        memset(pad, 0, 64);
    }
    
    for (int j = 0; j < 8; j++) {
        pad[56 + j] = (uint8_t)(total_len >> (j * 8));
    }
    md5_transform(state, pad);
    
    fclose(f);
    
    for (int j = 0; j < 4; j++) {
        out[j*4 + 0] = (uint8_t)(state[j]);
        out[j*4 + 1] = (uint8_t)(state[j] >> 8);
        out[j*4 + 2] = (uint8_t)(state[j] >> 16);
        out[j*4 + 3] = (uint8_t)(state[j] >> 24);
    }
    
    return 0;
}

int hash_file_sha1(const char* path, uint8_t out[HASH_SHA1_SIZE]) {
    FILE* f = fopen(path, "rb");
    if (!f) return -1;
    
    uint32_t state[5] = { 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 };
    uint8_t block[64];
    size_t bytes_read;
    uint64_t total_len = 0;
    
    while ((bytes_read = fread(block, 1, 64, f)) == 64) {
        sha1_transform(state, block);
        total_len += 64 * 8;
    }
    
    uint8_t pad[64] = {0};
    memcpy(pad, block, bytes_read);
    pad[bytes_read] = 0x80;
    total_len += bytes_read * 8;
    
    if (bytes_read >= 56) {
        sha1_transform(state, pad);
        memset(pad, 0, 64);
    }
    
    for (int j = 0; j < 8; j++) {
        pad[55 - j] = (uint8_t)(total_len >> (j * 8));
    }
    sha1_transform(state, pad);
    
    fclose(f);
    
    for (int j = 0; j < 5; j++) {
        out[j*4 + 0] = (uint8_t)(state[j] >> 24);
        out[j*4 + 1] = (uint8_t)(state[j] >> 16);
        out[j*4 + 2] = (uint8_t)(state[j] >> 8);
        out[j*4 + 3] = (uint8_t)(state[j]);
    }
    
    return 0;
}

int hash_file_sha256(const char* path, uint8_t out[HASH_SHA256_SIZE]) {
    FILE* f = fopen(path, "rb");
    if (!f) return -1;
    
    uint32_t state[8] = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    };
    uint8_t block[64];
    size_t bytes_read;
    uint64_t total_len = 0;
    
    while ((bytes_read = fread(block, 1, 64, f)) == 64) {
        sha256_transform(state, block);
        total_len += 64 * 8;
    }
    
    uint8_t pad[64] = {0};
    memcpy(pad, block, bytes_read);
    pad[bytes_read] = 0x80;
    total_len += bytes_read * 8;
    
    if (bytes_read >= 56) {
        sha256_transform(state, pad);
        memset(pad, 0, 64);
    }
    
    for (int j = 0; j < 8; j++) {
        pad[63 - j] = (uint8_t)(total_len >> (j * 8));
    }
    sha256_transform(state, pad);
    
    fclose(f);
    
    for (int j = 0; j < 8; j++) {
        out[j*4 + 0] = (uint8_t)(state[j] >> 24);
        out[j*4 + 1] = (uint8_t)(state[j] >> 16);
        out[j*4 + 2] = (uint8_t)(state[j] >> 8);
        out[j*4 + 3] = (uint8_t)(state[j]);
    }
    
    return 0;
}

/* ============ HashService Implementation ============ */

DI_SERVICE_INIT(HashService, hash_service) {
    (void)self;
    init_crc32_table();
    return DI_OK;
}

DI_SERVICE_CLEANUP(HashService, hash_service) {
    (void)self;
}

DI_DEFINE_SERVICE(HashService, hash_service)
