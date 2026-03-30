/**
 * @file file_service.h
 * @brief File system operations abstraction
 * 
 * Features:
 * - Read/write text files
 * - File existence checking
 * - File copy and delete
 * - Working directory management
 * 
 * @code
 * // Usage example:
 * FileService* files = INJECT_SERVICE(file_service);
 * 
 * // Read file (caller must free result)
 * char* content = file_read_text(files, "config.txt");
 * if (content) {
 *     printf("%s\n", content);
 *     free(content);
 * }
 * 
 * // Write file
 * if (result_is_ok(file_write_text(files, "output.txt", "Hello"))) {
 *     printf("File written\n");
 * }
 * @endcode
 */

#ifndef FILE_SERVICE_H
#define FILE_SERVICE_H

#include "di/di.h"
#include "core/base_service.h"
#include "constants.h"
#include <stdbool.h>
#include <stddef.h>

/**
 * @brief File service instance
 */
typedef struct FileService {
    DI_Service base;                      /**< DI base structure */
    char* working_directory;              /**< Current working directory */
} FileService;

/* DI declarations */
DI_DECLARE_SERVICE(FileService, file_service);

/**
 * @brief Read entire file as text
 * @param self FileService instance
 * @param path Path to file
 * @return Allocated string - CALLER MUST FREE, or NULL on error
 */
char* file_read_text(FileService* self, const char* path);

/**
 * @brief Write text to file
 * @param self FileService instance
 * @param path Path to file
 * @param content Content to write
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult file_write_text(FileService* self, const char* path, const char* content);

/**
 * @brief Check if file exists
 * @param self FileService instance
 * @param path Path to check
 * @return true if exists, false otherwise
 */
bool file_exists(FileService* self, const char* path);

/**
 * @brief Delete a file
 * @param self FileService instance
 * @param path Path to file to delete
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult file_delete(FileService* self, const char* path);

/**
 * @brief Copy a file
 * @param self FileService instance
 * @param src Source file path
 * @param dst Destination file path
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult file_copy(FileService* self, const char* src, const char* dst);

/**
 * @brief Get file size in bytes
 * @param self FileService instance
 * @param path Path to file
 * @return File size in bytes, or -1 on error
 */
long file_get_size(FileService* self, const char* path);

/**
 * @brief Get current working directory
 * @param self FileService instance
 * @return Working directory path (internal, do not free)
 */
const char* file_get_working_dir(FileService* self);

/**
 * @brief Set working directory
 * @param self FileService instance
 * @param path New working directory
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult file_set_working_dir(FileService* self, const char* path);

#endif /* FILE_SERVICE_H */
