/* Hash Service Tests */

#include "tests/test_utils.h"
#include "services/hash_service.h"

TEST_SUITE_INIT(hash_suite);

TEST(test_hash_injection) {
    TEST_START();
    HashService* hash = hash_service_inject();
    ASSERT_NOT_NULL(hash);
    ASSERT_STR_EQ(hash->base.name, "hash_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_md5) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* md5 = hash_md5_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(md5);
    ASSERT_EQ(strlen(md5), 32);
    
    free(md5);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_md5_consistency) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* hash1 = hash_md5_hex("test", 4);
    char* hash2 = hash_md5_hex("test", 4);
    
    ASSERT_NOT_NULL(hash1);
    ASSERT_NOT_NULL(hash2);
    ASSERT_STR_EQ(hash1, hash2);
    
    free(hash1);
    free(hash2);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_sha1) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* sha1 = hash_sha1_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(sha1);
    ASSERT_EQ(strlen(sha1), 40);
    
    free(sha1);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_sha256) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* sha256 = hash_sha256_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(sha256);
    ASSERT_EQ(strlen(sha256), 64);
    
    free(sha256);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_crc32) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    uint32_t crc = hash_crc32("Hello, World!", 13);
    ASSERT_GT(crc, 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_empty_input) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* md5 = hash_md5_hex("", 0);
    ASSERT_NOT_NULL(md5);
    ASSERT_EQ(strlen(md5), 32);
    
    free(md5);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_different_inputs) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    char* hash1 = hash_sha256_hex("input1", 6);
    char* hash2 = hash_sha256_hex("input2", 6);
    
    ASSERT_NOT_NULL(hash1);
    ASSERT_NOT_NULL(hash2);
    ASSERT_NE(strcmp(hash1, hash2), 0);
    
    free(hash1);
    free(hash2);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_hash_binary_output) {
    TEST_START();
    HashService* hash = hash_service_inject();
    
    unsigned char* binary = hash_md5_binary("test", 4);
    ASSERT_NOT_NULL(binary);
    
    int is_zero = 1;
    for (int i = 0; i < 16; i++) {
        if (binary[i] != 0) {
            is_zero = 0;
            break;
        }
    }
    ASSERT_FALSE(is_zero);
    
    free(binary);
    TEST_END(TEST_PASS, NULL);
}
