/* Auth Service Tests */

#include "tests/test_utils.h"
#include "services/sqlite_service.h"
#include "services/auth_service.h"
#include "migrations.h"

TEST_SUITE_INIT(auth_suite);

TEST(test_auth_injection) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    ASSERT_NOT_NULL(auth);
    ASSERT_STR_EQ(auth->base.name, "auth_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_hash_password) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    
    char* hash = auth_hash_password(auth, "TestPassword123!");
    ASSERT_NOT_NULL(hash);
    ASSERT_GT(strlen(hash), 0);
    ASSERT_STR_CONTAINS(hash, "$");
    
    free(hash);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_verify_password) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    
    char* hash = auth_hash_password(auth, "CorrectPassword123!");
    ASSERT_NOT_NULL(hash);
    
    ASSERT_TRUE(auth_verify_password(auth, "CorrectPassword123!", hash));
    ASSERT_FALSE(auth_verify_password(auth, "WrongPassword123!", hash));
    
    free(hash);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_valid) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "ValidPass123", &error);
    ASSERT_TRUE(result);
    ASSERT_NULL(error);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_too_short) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "Sh1!", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_no_uppercase) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "lowercase123", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_no_lowercase) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "UPPERCASE123", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_no_digit) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "NoDigitsHere!", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_register_success) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    AuthRegisterData data = {
        .username = "newuser",
        .email = "newuser@test.com",
        .password = "NewUser123!"
    };
    
    AuthUser* user = NULL;
    char* error = NULL;
    
    int result = auth_register(auth, &data, &user, &error);
    ASSERT_TRUE(result);
    ASSERT_NOT_NULL(user);
    ASSERT_EQ(user->id, 1);
    ASSERT_STR_EQ(user->username, "newuser");
    
    auth_free_user(user);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_register_duplicate_username) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    AuthRegisterData data1 = {
        .username = "duplicate",
        .email = "dup1@test.com",
        .password = "DupUser123!"
    };
    
    AuthRegisterData data2 = {
        .username = "duplicate",
        .email = "dup2@test.com",
        .password = "DupUser123!"
    };
    
    AuthUser* user = NULL;
    char* error = NULL;
    
    ASSERT_TRUE(auth_register(auth, &data1, &user, &error));
    auth_free_user(user);
    free(error);
    error = NULL;
    
    int result = auth_register(auth, &data2, &user, &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    auth_free_user(user);
    free(error);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_login_success) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    AuthRegisterData reg = {
        .username = "loginuser",
        .email = "login@test.com",
        .password = "LoginPass123!"
    };
    AuthUser* reg_user = NULL;
    char* error = NULL;
    auth_register(auth, &reg, &reg_user, &error);
    auth_free_user(reg_user);
    free(error);
    
    AuthLoginCredentials creds = {
        .username_or_email = "loginuser",
        .password = "LoginPass123!"
    };
    
    AuthToken* token = NULL;
    AuthUser* user = NULL;
    
    int result = auth_login(auth, &creds, &token, &user, &error);
    ASSERT_TRUE(result);
    ASSERT_NOT_NULL(token);
    ASSERT_NOT_NULL(token->access_token);
    ASSERT_NOT_NULL(token->refresh_token);
    ASSERT_NOT_NULL(user);
    ASSERT_STR_EQ(user->username, "loginuser");
    
    auth_free_token(token);
    auth_free_user(user);
    free(error);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_login_wrong_password) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    AuthRegisterData reg = {
        .username = "wrongpw",
        .email = "wrongpw@test.com",
        .password = "CorrectPass123!"
    };
    AuthUser* reg_user = NULL;
    char* error = NULL;
    auth_register(auth, &reg, &reg_user, &error);
    auth_free_user(reg_user);
    free(error);
    
    AuthLoginCredentials creds = {
        .username_or_email = "wrongpw",
        .password = "WrongPass123!"
    };
    
    AuthToken* token = NULL;
    AuthUser* user = NULL;
    
    int result = auth_login(auth, &creds, &token, &user, &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    auth_free_token(token);
    auth_free_user(user);
    free(error);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_token_generation) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    
    char* access_token = auth_generate_access_token(auth, 123, AUTH_ROLE_USER);
    ASSERT_NOT_NULL(access_token);
    ASSERT_GT(strlen(access_token), 0);
    
    char* refresh_token = auth_generate_refresh_token(auth, 123);
    ASSERT_NOT_NULL(refresh_token);
    ASSERT_GT(strlen(refresh_token), 0);
    
    free(access_token);
    free(refresh_token);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_role_name) {
    TEST_START();
    
    ASSERT_STR_EQ(auth_role_name(AUTH_ROLE_USER), "user");
    ASSERT_STR_EQ(auth_role_name(AUTH_ROLE_ADMIN), "admin");
    ASSERT_STR_EQ(auth_role_name(AUTH_ROLE_SUPER_ADMIN), "super_admin");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_has_role) {
    TEST_START();
    
    ASSERT_TRUE(auth_has_role(AUTH_ROLE_ADMIN, AUTH_ROLE_USER));
    ASSERT_TRUE(auth_has_role(AUTH_ROLE_SUPER_ADMIN, AUTH_ROLE_ADMIN));
    ASSERT_FALSE(auth_has_role(AUTH_ROLE_USER, AUTH_ROLE_ADMIN));
    
    TEST_END(TEST_PASS, NULL);
}
