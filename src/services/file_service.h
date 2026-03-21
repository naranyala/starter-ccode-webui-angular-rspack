/* File Service - File system operations */

#ifndef FILE_SERVICE_H
#define FILE_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <stddef.h>

typedef struct FileService {
    DI_Service base;
    char* working_directory;
} FileService;

DI_DECLARE_SERVICE(FileService, file_service);

/* File methods */
char* file_read_text(FileService* self, const char* path);
int file_write_text(FileService* self, const char* path, const char* content);
int file_exists(FileService* self, const char* path);
int file_delete(FileService* self, const char* path);
int file_copy(FileService* self, const char* src, const char* dst);
long file_get_size(FileService* self, const char* path);
const char* file_get_working_dir(FileService* self);

#endif /* FILE_SERVICE_H */
