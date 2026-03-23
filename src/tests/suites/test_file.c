/* File Service Tests */

#include "tests/test_utils.h"
#include "services/file_service.h"

TEST_SUITE_INIT(file_suite);

TEST(test_file_injection) {
    TEST_START();
    FileService* files = file_service_inject();
    ASSERT_NOT_NULL(files);
    ASSERT_STR_EQ(files->base.name, "file_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_get_working_dir) {
    TEST_START();
    FileService* files = file_service_inject();
    
    const char* cwd = file_get_working_dir(files);
    ASSERT_NOT_NULL(cwd);
    ASSERT_GT(strlen(cwd), 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_read_write_text) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* test_path = test_create_temp_file("Hello, World!");
    ASSERT_NOT_NULL(test_path);
    
    char* content = file_read_text(files, test_path);
    ASSERT_NOT_NULL(content);
    ASSERT_STR_EQ(content, "Hello, World!");
    free(content);
    
    int result = file_write_text(files, test_path, "New content");
    ASSERT_EQ(result, 1);
    
    content = file_read_text(files, test_path);
    ASSERT_NOT_NULL(content);
    ASSERT_STR_EQ(content, "New content");
    free(content);
    
    test_remove_temp_file(test_path);
    free(test_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_exists) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* existing_path = test_create_temp_file("test");
    ASSERT_NOT_NULL(existing_path);
    
    ASSERT_TRUE(file_exists(files, existing_path));
    ASSERT_FALSE(file_exists(files, "/nonexistent/path/file.txt"));
    
    test_remove_temp_file(existing_path);
    free(existing_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_delete) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* test_path = test_create_temp_file("to delete");
    ASSERT_NOT_NULL(test_path);
    ASSERT_TRUE(file_exists(files, test_path));
    
    int result = file_delete(files, test_path);
    ASSERT_EQ(result, 1);
    ASSERT_FALSE(file_exists(files, test_path));
    
    free(test_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_copy) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* src_path = test_create_temp_file("copy me");
    char* dst_path = strdup("/tmp/test_copy_dest_XXXXXX");
    mkstemp(dst_path);
    unlink(dst_path);
    
    ASSERT_NOT_NULL(src_path);
    ASSERT_NOT_NULL(dst_path);
    
    int result = file_copy(files, src_path, dst_path);
    ASSERT_EQ(result, 1);
    ASSERT_TRUE(file_exists(files, dst_path));
    
    char* content = file_read_text(files, dst_path);
    ASSERT_NOT_NULL(content);
    ASSERT_STR_EQ(content, "copy me");
    free(content);
    
    test_remove_temp_file(src_path);
    test_remove_temp_file(dst_path);
    free(src_path);
    free(dst_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_get_size) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* test_path = test_create_temp_file("12345");
    ASSERT_NOT_NULL(test_path);
    
    long size = file_get_size(files, test_path);
    ASSERT_EQ(size, 5);
    
    test_remove_temp_file(test_path);
    free(test_path);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_file_read_nonexistent) {
    TEST_START();
    FileService* files = file_service_inject();
    
    char* content = file_read_text(files, "/nonexistent/file.txt");
    ASSERT_NULL(content);
    
    TEST_END(TEST_PASS, NULL);
}
