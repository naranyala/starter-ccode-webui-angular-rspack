# Hash Service

Cryptographic hashing utilities.

## Overview

HashService provides various cryptographic hash functions for data integrity and password hashing.

## API

### Hash Functions

| Function | Description |
|----------|-------------|
| `hash_md5(const char* input)` | Calculate MD5 hash |
| `hash_sha1(const char* input)` | Calculate SHA1 hash |
| `hash_sha256(const char* input)` | Calculate SHA256 hash |
| `hash_crc32(const char* input)` | Calculate CRC32 checksum |

### Utility Functions

| Function | Description |
|----------|-------------|
| `hash_hex_to_bytes(const char* hex)` | Convert hex to bytes |
| `hash_bytes_to_hex(const char* bytes, size_t len)` | Convert bytes to hex |

## Usage

```c
#include "services/hash_service.h"

// MD5 hash
const char* md5 = hash_md5("Hello, World!");
printf("MD5: %s\n", md5);

// SHA256 hash
const char* sha256 = hash_sha256("password");
printf("SHA256: %s\n", sha256);

// CRC32 checksum
uint32_t crc = hash_crc32("data");
printf("CRC32: %u\n", crc);
```

## Output Formats

| Algorithm | Output Length | Format |
|-----------|---------------|--------|
| MD5 | 16 bytes | Hex string (32 chars) |
| SHA1 | 20 bytes | Hex string (40 chars) |
| SHA256 | 32 bytes | Hex string (64 chars) |
| CRC32 | 4 bytes | Integer |

## Common Use Cases

- File integrity verification
- Password hashing (with salt)
- Data deduplication
- Checksums for downloads

## Related Documentation

- [Auth Service](auth.md) - Password hashing
