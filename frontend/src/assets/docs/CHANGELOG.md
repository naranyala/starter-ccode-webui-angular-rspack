# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Added `data/` directory for application data (databases, logs, etc.)
- Added CHANGELOG.md to track project changes
- Added FRONTEND_DIR constant in build.c for centralized frontend path configuration

### Changed

#### Frontend (Angular)

- **data-table.component.ts**: Added proper `OnInit` interface implementation
  - *Reasoning*: The component had `ngOnInit()` method but didn't implement `OnInit` interface. This is a TypeScript best practice that ensures proper lifecycle hook typing and prevents runtime errors.

- **sqlite.component.ts**: Added proper `OnInit` interface implementation
  - *Reasoning*: Same as above - component used lifecycle hook without declaring interface implementation.

- **notification.service.ts**: Added `readonly` to private signal declaration
  - *Reasoning*: Signals should be declared as `readonly` to prevent accidental reassignment. This follows Angular best practices and improves code safety.

- **devtools.service.ts**: Added `readonly` to private signal declaration
  - *Reasoning*: Same as notification.service.ts - signals are immutable after initialization.

- **webui-demo.component.ts**: Changed from constructor injection to `inject()` function
  - *Reasoning*: Modern Angular (v14+) recommends using `inject()` function over constructor injection for better tree-shaking, cleaner code, and consistency with signal-based services.

#### Backend (C)

- **auth_internal.h**: Fixed header guard naming convention
  - *Reasoning*: Header guard was `AUTH_INTERNAL_H` instead of `AUTH_SERVICE_INTERNAL_H`. Inconsistent naming could cause collisions if another header with same name is added.

- **main.c**: Updated database path from `app.db` to `data/app.db`
  - *Reasoning*: Application data should be stored in a dedicated directory, not in project root. This separates code from data and follows standard project conventions.

- **database_service.c**: Updated default database path to `data/app.db`
  - *Reasoning*: Same as main.c - ensures all database operations use consistent path location.

- **build.c**: Added FRONTEND_DIR and other constants
  - *Reasoning*: Centralized configuration makes it easier to change frontend location in one place. Also added DATA_DIR constant for future use.

#### Project Configuration

- **.gitignore**: Updated to include:
  - `data/` - Application data should not be committed
  - `thirdparty/*.zip` - Zip archives are not needed after extraction
  - `frontend-alt*/dist` and `frontend-alt*/.angular` - Build artifacts from alternative frontends
  - *Reasoning*: Proper .gitignore prevents accidentally committing binaries, dependencies, and data files.

- **README.md**: Updated project structure documentation
  - Added documentation for `frontend-alt88/` and `frontend-alt99/` variants
  - Added `data/` directory to structure
  - Removed reference to non-existent `frontend-legacy/`
  - *Reasoning*: Documentation should reflect actual project state to prevent confusion.

### Removed

- Removed ~105MB of zip files from thirdparty directory:
  - `duckdb_cli-linux-amd64.zip`
  - `libduckdb-linux-amd64.zip`
  - `sqlite-amalgamation-3510300.zip`
  - `sqlite-doc-3510300.zip`
  - `static-duckdb-libs-linux-amd64.zip`
  - *Reasoning*: Extracted files are already present in thirdparty/. Zip files are not needed after extraction and were bloating the repository.

- Moved `app.db` from project root to `data/` directory
  - *Reasoning*: Application data should be separated from source code. Root directory should only contain project files.

### Fixed

- Fixed missing imports in TypeScript components (OnInit)
- Fixed inconsistent signal declaration patterns
- Fixed service injection pattern inconsistencies
- Fixed header guard naming inconsistency
- Fixed database path inconsistencies across C codebase

---

## Why These Changes Matter

### 1. TypeScript/Angular Improvements

The frontend changes focus on:
- **Type Safety**: Implementing `OnInit` interface ensures TypeScript can catch errors at compile time
- **Code Consistency**: Using `readonly` signals and `inject()` function follows modern Angular best practices
- **Maintainability**: Consistent patterns make the codebase easier to understand and extend

### 2. C Backend Improvements

The backend changes focus on:
- **Naming Conventions**: Consistent header guards prevent naming collisions
- **Project Structure**: Separating data from code follows standard practices
- **Configuration**: Centralized constants make future changes easier

### 3. Project Hygiene

The structural changes focus on:
- **Repository Size**: Removing unnecessary zip files reduces clone time and storage
- **Git History**: Cleaner .gitignore prevents binary bloat in version control
- **Documentation**: Accurate docs reduce confusion and onboarding time

---

## Migration Notes

### For Existing Users

1. The database file has moved from `./app.db` to `./data/app.db`
   - If you have an existing `app.db`, move it to `data/app.db`
   - Or rebuild the database fresh with `./run.sh dev`

2. Thirdparty zip files are no longer needed
   - They have been removed to save space
   - If you need them, they can be downloaded again from their sources

### For Developers

- When adding new services, use `inject()` function for dependency injection
- Always implement `OnInit` interface when using `ngOnInit()`
- Store any new data files in `data/` directory
- Keep header guards consistent: `{SERVICE_NAME}_SERVICE_{INTERNAL}_H`
