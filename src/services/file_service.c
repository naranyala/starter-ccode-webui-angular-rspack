/**
 * @file file_service.c
 * @brief File service implementation - File system operations
 */

#include "services/file_service.h"
#include "services/logger_service.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>
#include <errno.h>

/* ============================================================================
 * DI Service Implementation
 * ============================================================================ */

DI_SERVICE_INIT(FileService, file_service) {
    VALIDATE_PTR(self, DI_ERROR_NULL_POINTER);

    /* Get working directory */
    char cwd[MAX_FILE_PATH_SIZE];
    if (getcwd(cwd, sizeof(cwd)) != NULL) {
        self->working_directory = strdup(cwd);
    } else {
        self->working_directory = strdup(".");
    }

    if (!self->working_directory) {
        return DI_ERROR_OUT_OF_MEMORY;
    }

    LoggerService* logger = logger_service_inject();
    LOG_DEBUG(logger, "FileService initialized, working dir: %s", cwd);

    return DI_OK;
}

DI_SERVICE_CLEANUP(FileService, file_service) {
    if (!self) return;
    if (self->working_directory) {
        free(self->working_directory);
        self->working_directory = NULL;
    }
}

DI_DEFINE_SERVICE(FileService, file_service)

/* ============================================================================
 * Public API Implementation
 * ============================================================================ */

char* file_read_text(FileService* self, const char* path) {
    VALIDATE_PTR(self, NULL);
    VALIDATE_STR(path, NULL);

    FILE* f = fopen(path, "r");
    if (!f) {
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to open file for reading: %s", path);
        return NULL;
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    if (size < 0) {
        fclose(f);
        return NULL;
    }

    char* content = (char*)malloc(size + 1);
    if (!content) {
        fclose(f);
        return NULL;
    }

    size_t bytes_read = fread(content, 1, size, f);
    content[bytes_read] = '\0';
    fclose(f);

    LoggerService* logger = logger_service_inject();
    LOG_DEBUG(logger, "Read %ld bytes from %s", bytes_read, path);

    return content;
}

ServiceResult file_write_text(FileService* self, const char* path, const char* content) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(path, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(content, RESULT_ERROR_INVALID_PARAM);

    FILE* f = fopen(path, "w");
    if (!f) {
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to open file for writing: %s", path);
        return RESULT_ERROR_IO;
    }

    fprintf(f, "%s", content);
    
    if (fclose(f) != 0) {
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to close file after writing: %s", path);
        return RESULT_ERROR_IO;
    }

    LoggerService* logger = logger_service_inject();
    LOG_DEBUG(logger, "Wrote %zu bytes to %s", strlen(content), path);

    return RESULT_OK;
}

bool file_exists(FileService* self, const char* path) {
    (void)self;
    
    if (!path) return false;

    struct stat st;
    return (stat(path, &st) == 0);
}

ServiceResult file_delete(FileService* self, const char* path) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(path, RESULT_ERROR_INVALID_PARAM);

    if (remove(path) != 0) {
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to delete file: %s (%s)", path, strerror(errno));
        return RESULT_ERROR_IO;
    }

    LoggerService* logger = logger_service_inject();
    LOG_INFO(logger, "Deleted file: %s", path);

    return RESULT_OK;
}

ServiceResult file_copy(FileService* self, const char* src, const char* dst) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(src, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(dst, RESULT_ERROR_INVALID_PARAM);

    FILE* src_file = fopen(src, "rb");
    if (!src_file) {
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to open source file: %s", src);
        return RESULT_ERROR_IO;
    }

    FILE* dst_file = fopen(dst, "wb");
    if (!dst_file) {
        fclose(src_file);
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to open destination file: %s", dst);
        return RESULT_ERROR_IO;
    }

    char buffer[DEFAULT_BUFFER_SIZE];
    size_t bytes_read;
    
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), src_file)) > 0) {
        if (fwrite(buffer, 1, bytes_read, dst_file) != bytes_read) {
            fclose(src_file);
            fclose(dst_file);
            LoggerService* logger = logger_service_inject();
            LOG_ERROR(logger, "Failed to write to destination file: %s", dst);
            return RESULT_ERROR_IO;
        }
    }

    fclose(src_file);
    fclose(dst_file);

    LoggerService* logger = logger_service_inject();
    LOG_INFO(logger, "Copied %s to %s", src, dst);

    return RESULT_OK;
}

long file_get_size(FileService* self, const char* path) {
    VALIDATE_PTR(self, -1);
    VALIDATE_STR(path, -1);

    struct stat st;
    if (stat(path, &st) != 0) {
        return -1;
    }

    return st.st_size;
}

const char* file_get_working_dir(FileService* self) {
    VALIDATE_PTR(self, NULL);
    return self->working_directory;
}

ServiceResult file_set_working_dir(FileService* self, const char* path) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(path, RESULT_ERROR_INVALID_PARAM);

    if (chdir(path) != 0) {
        LoggerService* logger = logger_service_inject();
        LOG_ERROR(logger, "Failed to change directory to: %s (%s)", path, strerror(errno));
        return RESULT_ERROR_IO;
    }

    /* Update working_directory */
    char cwd[MAX_FILE_PATH_SIZE];
    if (getcwd(cwd, sizeof(cwd)) != NULL) {
        if (self->working_directory) {
            free(self->working_directory);
        }
        self->working_directory = strdup(cwd);
        
        if (!self->working_directory) {
            return RESULT_ERROR_OUT_OF_MEMORY;
        }
    }

    LoggerService* logger = logger_service_inject();
    LOG_INFO(logger, "Changed working directory to: %s", cwd);

    return RESULT_OK;
}
