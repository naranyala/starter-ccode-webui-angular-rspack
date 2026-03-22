/* Hash Service - Simple hash functions (MD5, SHA1, CRC32) */

#ifndef HASH_SERVICE_H
#define HASH_SERVICE_H

#include "di/di.h"
#include <stdint.h>
#include <stddef.h>

#define HASH_MD5_SIZE    16
#define HASH_SHA1_SIZE   20
#define HASH_SHA256_SIZE 32
#define HASH_CRC32_SIZE  4

typedef struct HashService {
    DI_Service base;
} HashService;

DI_DECLARE_SERVICE(HashService, hash_service);

/* CRC32 */
uint32_t hash_crc32(const void* data, size_t len);

/* MD5 */
int hash_md5(const void* data, size_t len, uint8_t out[HASH_MD5_SIZE]);
char* hash_md5_hex(const void* data, size_t len);

/* SHA1 */
int hash_sha1(const void* data, size_t len, uint8_t out[HASH_SHA1_SIZE]);
char* hash_sha1_hex(const void* data, size_t len);

/* SHA256 */
int hash_sha256(const void* data, size_t len, uint8_t out[HASH_SHA256_SIZE]);
char* hash_sha256_hex(const void* data, size_t len);

/* File hashing */
int hash_file_md5(const char* path, uint8_t out[HASH_MD5_SIZE]);
int hash_file_sha1(const char* path, uint8_t out[HASH_SHA1_SIZE]);
int hash_file_sha256(const char* path, uint8_t out[HASH_SHA256_SIZE]);

/* Utility */
char* hash_bytes_to_hex(const uint8_t* bytes, size_t len);

#endif /* HASH_SERVICE_H */
