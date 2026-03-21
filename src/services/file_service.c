/* File Service Implementation - File system operations */

#include "services/file_service.h"
#include "services/logger_service.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>
#include <limits.h>
#include <errno.h>

DI_SERVICE_INIT(FileService, file_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    /* Get working directory */
    char cwd[PATH_MAX];
    if (getcwd(cwd, sizeof(cwd)) != NULL) {
        self->working_directory = strdup(cwd);
    } else {
        self->working_directory = strdup(".");
    }
    
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

char* file_read_text(FileService* self, const char* path) {
    if (!self || !path) return NULL;
    
    FILE* f = fopen(path, "r");
    if (!f) return NULL;
    
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
    
    size_t read = fread(content, 1, size, f);
    content[read] = '\0';
    fclose(f);
    
    return content;
}

int file_write_text(FileService* self, const char* path, const char* content) {
    if (!self || !path || !content) return -1;
    
    FILE* f = fopen(path, "w");
    if (!f) return -1;
    
    fprintf(f, "%s", content);
    fclose(f);
    
    return 0;
}

int file_exists(FileService* self, const char* path) {
    (void)self;
    if (!path) return 0;
    
    struct stat st;
    return (stat(path, &st) == 0);
}

int file_delete(FileService* self, const char* path) {
    (void)self;
    if (!path) return -1;
    
    return remove(path);
}

int file_copy(FileService* self, const char* src, const char* dst) {
    if (!self || !src || !dst) return -1;
    
    FILE* src_file = fopen(src, "rb");
    if (!src_file) return -1;
    
    FILE* dst_file = fopen(dst, "wb");
    if (!dst_file) {
        fclose(src_file);
        return -1;
    }
    
    char buffer[4096];
    size_t bytes;
    while ((bytes = fread(buffer, 1, sizeof(buffer), src_file)) > 0) {
        if (fwrite(buffer, 1, bytes, dst_file) != bytes) {
            fclose(src_file);
            fclose(dst_file);
            return -1;
        }
    }
    
    fclose(src_file);
    fclose(dst_file);
    return 0;
}

long file_get_size(FileService* self, const char* path) {
    (void)self;
    if (!path) return -1;
    
    struct stat st;
    if (stat(path, &st) != 0) return -1;
    
    return (long)st.st_size;
}

const char* file_get_working_dir(FileService* self) {
    if (!self) return NULL;
    return self->working_directory;
}
